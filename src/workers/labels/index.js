import path from 'path';
import fs from 'fs-extra';
import msgpack from 'msgpack-lite';
import * as AddressFormat from '@cpsdqs/google-i18n-address';
import PDFDocument from 'pdfkit';
import tmp from 'tmp-promise';
const nodeFs = require('fs').promises;

import * as AKSOMail from 'akso/mail';
import * as AKSONotif from 'akso/notif';
import QueryUtil from 'akso/lib/query-util';

import { schema as parSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

const schema = {
	...parSchema,
	...{
		maxQueryLimit: 100
	}
};

// From: https://github.com/foliojs/pdfkit/blob/b13423bf0a391ed1c33a2e277bc06c00cabd6bf9/lib/page.coffee#L72-L122
const PAGE_SIZES = {
	A3: [841.89, 1190.55],
	A4: [595.28, 841.89],
	A5: [419.53, 595.28],
	LETTER: [612.00, 792.00],
	LEGAL: [612.00, 1008.00],
	FOLIO: [612.00, 936.00],
	EXECUTIVE: [521.86, 756.00]
};

export async function init () {
	// Set up dir scanning
	scheduleTimer(0);
}

function scheduleTimer (wait = 500) {
	setTimeout(() => { timer().catch(e => { throw e; }); }, wait);
}

async function timer () {
	const scheduleDir = path.join(AKSO.conf.stateDir, 'address_label_orders');
	const dir = await nodeFs.opendir(scheduleDir);
	let entry;
	do {
		entry = await dir.read();
		if (!entry) { break; }
		if (!entry.isFile() || entry.name.indexOf('label-') !== 0) { continue; }
		const file = path.join(scheduleDir, entry.name);
		const rawData = await fs.readFile(file);
		const data = msgpack.decode(rawData, { codec: AKSO.msgpack });
		await processLabelOrder(data);
		await fs.unlink(file);
	} while (entry);
	await dir.close();
	scheduleTimer();
}

async function processLabelOrder (data) {
	const req = {
		memberFilter: data.memberFilter,
		query: data.query,
		body: data.body
	};
	const query = AKSO.db('view_codeholders')
		.select([
			'newCode',
			'address_country',
			'address_countryArea',
			'address_city',
			'address_cityArea',
			'address_streetAddress',
			'address_postalCode',
			'address_sortingCode',
			'honorific',
			'firstNameLegal',
			'lastNameLegal',
			'fullName',
			'fullNameLocal',
			'careOf'
		])
		.whereNotNull('address_country');
	memberFilter(schema, query, req); // safe for snapshot as only req.memberFilter is used

	if ('snapshot' in data.body) {
		query.innerJoin('magazines_paperAccessSnapshots_codeholders', 'magazines_paperAccessSnapshots_codeholders.codeholderId', 'view_codeholders.id')
			.where('snapshotId', data.body.snapshot);

		if ('snapshotCompare' in data.body) {
			query.whereNotExists(function () {
				this.select(1)
					.from(AKSO.db.raw('magazines_paperAccessSnapshots_codeholders c'))
					.where('c.snapshotId', data.body.snapshotCompare)
					.whereRaw('`c`.`codeholderId` = view_codeholders.id');
			});
		}
	} else {
		QueryUtil.simpleCollection(req, schema, query);
	}

	const labelsPerPage = req.body.cols * req.body.rows;
	query.limit(labelsPerPage);

	// Obtain the country names
	const countryNames = {};
	const name = 'name_' + req.body.language;
	(await AKSO.db('countries')
		.select('code', name)
	).forEach(x => {
		countryNames[x.code] = x[name];
	});

	const doc = new PDFDocument({
		autoFirstPage: false,
		margin: 0
	});
	const pageSizeOuter = PAGE_SIZES[req.body.paper];
	const pageSizeInner = [
		pageSizeOuter[0] - req.body.margins.left - req.body.margins.right,
		pageSizeOuter[1] - req.body.margins.top - req.body.margins.bottom
	];
	const cellSize = [
		(pageSizeInner[0] - req.body.colGap * ( req.body.cols - 1 )) / req.body.cols,
		(pageSizeInner[1] - req.body.rowGap * ( req.body.rows - 1 )) / req.body.rows
	];

	const tmpFile = await tmp.file({ discardDescriptor: true });
	const writeStream = fs.createWriteStream(tmpFile.path);
	const docReady = new Promise((resolve, reject) => {
		writeStream.on('finish', resolve);
		writeStream.on('error', reject);
	});
	doc.pipe(writeStream);

	doc.registerFont('arial', path.join(AKSO.dir, 'data/fonts/Arial.ttf'));
	doc.font('arial');
	doc.fontSize(req.body.fontSize);

	let codeholders;
	let offset = 0;
	getCodeholders:
	do {
		query.offset(offset); // TODO: New codeholders could appear in the interrim. Thus we need something like this: https://dba.stackexchange.com/questions/46459/putting-a-select-statement-in-a-transaction
		codeholders = await query;
		if (!codeholders.length) { break; }
		offset += codeholders.length;

		const codeholderData = await Promise.all(codeholders.map(async codeholder => {
			const addressObj = {
				countryCode: 	codeholder.address_country,
				countryArea: 	codeholder.address_countryArea,
				city: 			codeholder.address_city,
				cityArea: 		codeholder.address_cityArea,
				streetAddress: 	codeholder.address_streetAddress,
				postalCode: 	codeholder.address_postalCode,
				sortingCode: 	codeholder.address_sortingCode,
				name: ''
			};

			if (codeholder.honorific) {
				addressObj.name += codeholder.honorific + ' ';
			}
			if (codeholder.firstNameLegal) {
				addressObj.name += codeholder.firstNameLegal;
			}
			if (codeholder.lastNameLegal) {
				addressObj.name += ' ' + codeholder.lastNameLegal;
			}

			addressObj.companyName = codeholder.fullNameLocal || codeholder.fullName;
			if (codeholder.careOf) {
				addressObj.companyName += `\nc/o ${codeholder.careOf}`;
			}

			const data = {
				address: await AddressFormat.formatAddress(
					addressObj,
					req.body.latin,
					req.body.language,
					countryNames[addressObj.countryCode]
				),
				codeholder: codeholder
			};

			return data;
		}));

		doc.addPage({
			size: req.body.paper
		});

		for (let y = 0; y < req.body.rows; y++) {
			for (let x = 0; x < req.body.cols; x++) {
				const index = y * req.body.cols + x;
				if (!codeholderData[index]) { break getCodeholders; }
				const data = codeholderData[index];

				const xPt = req.body.margins.left + x * cellSize[0] + x * req.body.colGap;
				const yPt = req.body.margins.top + y * cellSize[1] + y * req.body.rowGap;

				const xPtPad = xPt + req.body.cellPadding;
				const yPtPad = yPt + req.body.cellPadding;

				const width = cellSize[0];
				const height = cellSize[1];

				const widthPad = width - req.body.cellPadding * 2;

				if (req.body.drawOutline) {
					doc.save()
						.moveTo(xPt, yPt)
						.lineTo(xPt + width, yPt) // top
						.lineTo(xPt + width, yPt + height) // right
						.lineTo(xPt, yPt + height) // bottom
						.lineTo(xPt, yPt) // left
						.stroke();
				}

				const codeText = req.body.includeCode ? data.codeholder.newCode : '';
				doc.text(codeText, xPtPad, yPtPad, {
					width: widthPad,
					align: 'right'
				});
				doc.text(data.address, {
					width: widthPad
				});
			}
		}

	} while (codeholders.length > 0);

	if (offset === 0) { // never found any codeholders
		doc.addPage({
			size: req.body.paper
		});
		doc.text('Nul etikedoj estis generitaj. Eble kontrolu vian filtrilon aŭ kontrolu ĉu la rezultaj trovitoj havas (validan) poŝtadreson.');

	}

	doc.end();
	await docReady;

	const fileBuffer = await fs.readFile(tmpFile.path);
	await fs.unlink(tmpFile.path);
	const emailConf = {
		attachments: [{
			filename: 'Adresetikdoj.pdf',
			content: fileBuffer.toString('base64'),
			type: 'application/pdf'
		}]
	};

	if (req.body.email) {
		await AKSOMail.renderSendEmail({
			personalizations: [{
				to: req.body.email,
				substitutions: {
					name: 'mendinto'
				}
			}],
			org: 'akso',
			tmpl: 'admin-address-labels-ready',
			msgData: emailConf
		});
	} else {
		await AKSONotif.sendNotification({
			codeholderIds: [ data.user ],
			org: 'akso',
			notif: 'admin-address-labels-ready',
			category: 'admin',
			tgAttach: {
				type: 'document',
				file: {
					source: fileBuffer,
					filename: 'Adresetikedoj.pdf'
				}
			},
			emailConf: emailConf
		});
	}
}
