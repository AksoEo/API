import AddressFormat from 'google-i18n-address';
import PDFDocument from 'pdfkit';
import fs from 'fs-extra';
import path from 'path';
import tmp from 'tmp-promise';

import QueryUtil from '../../lib/query-util';
import * as AKSOMail from '../../mail';
import * as AKSONotif from '../../notif';

import { schema as parSchema, memberFilter, memberFieldsManual } from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: {
			type: 'object',
			properties: {
				email: {
					type: 'string',
					format: 'email'
				},
				language: {
					type: 'string',
					enum: [
						'eo', 'en', 'fr', 'es',
						'nl', 'pt', 'sk', 'zh',
						'de'
					]
				},
				latin: {
					type: 'boolean',
					default: false
				},
				includeCode: {
					type: 'boolean',
					default: true
				},
				paper: {
					type: 'string',
					default: 'A4',
					enum: [ 'A3', 'A4', 'A5', 'LETTER', 'FOLIO', 'LEGAL', 'EXECUTIVE' ]
				},
				margins: {
					type: 'object',
					properties: {
						top: {
							type: 'number',
							format: 'uint16'
						},
						bottom: {
							type: 'number',
							format: 'uint16'
						},
						left: {
							type: 'number',
							format: 'uint16'
						},
						right: {
							type: 'number',
							format: 'uint16'
						}
					},
					required: [ 'top', 'bottom', 'left', 'right' ],
					additionalProperties: false,
					default: {
						top: 72,
						bottom: 72,
						left: 72,
						right: 72
					}
				},
				cols: {
					type: 'integer',
					minimum: 1,
					maximum: 20
				},
				rows: {
					type: 'integer',
					minimum: 1,
					maximum: 50
				},
				colGap: {
					type: 'number',
					format: 'uint16'
				},
				rowGap: {
					type: 'number',
					format: 'uint16'
				},
				cellPadding: {
					type: 'number',
					format: 'uint16',
					default: 8
				},
				fontSize: {
					type: 'integer',
					minimum: 8,
					maximum: 30,
					default: 12
				},
				drawOutline: {
					type: 'boolean',
					default: false
				}
			},
			required: [ 'language', 'cols', 'rows', 'colGap', 'rowGap' ],
			additionalProperties: false
		},
		requirePerms: 'codeholders.read'
	}
};
schema.alwaysWhere = (query, req) => memberFilter(schema, query, req);

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

export default {
	schema: schema,

	run: async function run (req, res) {
		if ('limit' in req.query) {
			return res.status(400).type('text/plain').send('?limit is not allowed');
		}
		if ('offset' in req.query) {
			return res.status(400).type('text/plain').send('?offset is not allowed');
		}
		if ('fields' in req.query) {
			return res.status(400).type('text/plain').send('?fields is not allowed');
		}

		if (!req.body.email && (!req.user || !req.user.isUser())) {
			return res.status(400).type('text/plain').send('email may only be left out when using user auth');
		}

		const query = AKSO.db('view_codeholders');

		// Restrictions
		const requiredMemberFields = [
			'id',
			'address.country',
			'address.countryArea',
			'address.city',
			'address.cityArea',
			'address.streetAddress',
			'address.postalCode',
			'address.sortingCode',
			'honorific',
			'firstNameLegal',
			'lastNameLegal',
			'fullName',
			'fullNameLocal',
			'careOf'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'r')) {
			return res.status(403).type('text/plain').send('Missing permitted address codeholder fields, check /perms');
		}

		let fieldWhitelist = null;
		if (req.memberFields) { fieldWhitelist = Object.keys(req.memberFields); }

		QueryUtil.simpleCollection(req, schema, query, fieldWhitelist);
		query.whereNotNull('address_country');
		query.select([
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
		]);

		const orderObj = {
			codeholderId: req.user.isUser() ? req.user.user : null,
			apiKey: req.user.isApp() ? req.user.app : null
		};
		const hasOrdered = await AKSO.db('addressLabelOrders')
			.where(orderObj)
			.first(1);
		if (hasOrdered) { return res.sendStatus(423); }
		
		res.sendStatus(202);
		await AKSO.db('addressLabelOrders')
			.insert(orderObj);

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
			query.offset(offset);
			codeholders = await query;
			if (!codeholders.length) { break; }
			offset += codeholders.length;

			const codeholderData = codeholders.map(codeholder => {
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
					address: AddressFormat.formatAddress(
						addressObj,
						req.body.latin,
						req.body.language,
						countryNames[addressObj.countryCode]
					),
					codeholder: codeholder
				};

				return data;
			});

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
					const heightPad = height - req.body.cellPadding * 2;

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
						height: heightPad,
						align: 'right'
					});
					doc.text(data.address, {
						width: widthPad,
						height: heightPad
					});
				}
			}

		} while (codeholders.length > 0);

		doc.end();
		await docReady;

		const fileBuffer = await fs.readFile(tmpFile.path);
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
				codeholderIds: [ req.user.user ],
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

		await AKSO.db('addressLabelOrders')
			.where(orderObj)
			.delete();
	}
};
