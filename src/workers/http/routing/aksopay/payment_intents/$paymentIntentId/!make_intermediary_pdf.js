import PdfPrinter from 'pdfmake';
import path from 'path';
import moment from 'moment-timezone';

import AKSOPayPaymentIntentResource from 'akso/lib/resources/aksopay-payment-intent-resource';
import { schema, afterQuery } from '../schema';
import RegistrationEntryResource from 'akso/lib/resources/registration-entry-resource';
import { schema as registrationEntrySchema, afterQuery as registrationEntryAfterQuery } from 'akso/workers/http/routing/registration/entries/schema';
import { formatCurrency as _formatCurrency } from 'akso/lib/akso-script-util';
import { arrToObjByKey } from 'akso/util';
import { formatCodeholderName } from 'akso/workers/http/lib/codeholder-util';

function formatCurrency (...args) {
	return _formatCurrency(...args)
		// Replace characters unsupported by Arial
		.replace(/\u202F/g, ' '); // NARROW NO-BREAK SPACE
}

const printer = new PdfPrinter({
	Arial: {
		normal: path.join(AKSO.dir, 'data/fonts/Arial.ttf'),
		bold: path.join(AKSO.dir, 'data/fonts/Arial-Bold.ttf'),
		italics: path.join(AKSO.dir, 'data/fonts/Arial-Italic.ttf'),
		bolditalics: path.join(AKSO.dir, 'data/fonts/Arial-Bold-Italic.ttf'),
	},
	Courier: {
		normal: 'Courier'
	},
});

export default {
	schema: {},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const paymentIntentRaw = await AKSO.db('pay_intents')
			.where('id', req.params.paymentIntentId)
			.first('*', { purposes: 1 });
		if (!paymentIntentRaw) { return res.sendStatus(404); }
		await new Promise(resolve => afterQuery([paymentIntentRaw], resolve));
		const paymentIntent = new AKSOPayPaymentIntentResource(paymentIntentRaw, {
			query: { fields: Object.keys(schema.fields) },
		}).obj;
		if (!req.hasPermission('pay.payment_intents.cancel.' + paymentIntent.org)) {
			if (paymentIntent.paymentMethod.type !== 'intermediary' ||
				!req.hasPermission(`pay.payment_intents.intermediary.${paymentIntent.org}.${paymentIntent.intermediaryCountryCode}`)) {
				return res.sendStatus(403);
			}
		}

		// Check intent status and payment method type
		if (paymentIntent.status !== 'succeeded') { return res.sendStatus(409); }
		if (paymentIntent.paymentMethod.type !== 'intermediary') {
			return res.type('text/plain').status(400)
				.send('intent must use an intermediary payment method');
		}

		const timeFormat = 'YYYY-MM-DD HH:mm:ss [UTC]';

		const countryName = (await AKSO.db('countries')
			.where('code', paymentIntent.intermediaryCountryCode)
			.first('name_eo')).name_eo;

		const title = `Spezraporto n-ro A${paymentIntent.intermediaryIdentifier.number}/${paymentIntent.intermediaryIdentifier.year} por ${countryName}`;

		const user = req.user.isUser() ?
			(await AKSO.db('codeholders')
				.first('newCode')
				.where('id', req.user.user)).newCode
			:'API-kliento ' + req.user.app.toString('hex');

		let sendUser = paymentIntent.createdBy.split(':');
		if (sendUser[0] === 'ch') {
			sendUser = (await AKSO.db('codeholders')
				.first('newCode')
				.where('id', sendUser[1])).newCode;
		} else if (sendUser[0] === 'app') {
			sendUser = 'API-kliento ' + sendUser[1];
		}

		const submissionTime = (await AKSO.db('pay_intents_events')
			.first('time')
			.where({
				paymentIntentId: paymentIntent.id,
				status: 'submitted',
			})).time;
		
		// SUMMARY
		const incomePurposes = [];
		const expensePurposes = [];
		const donationPurposes = [];
		const registrationPurposes = [];
		let totalGrossAmount = 0;
		for (const purpose of paymentIntent.purposes) {
			totalGrossAmount += purpose.amount;
			if (purpose.type === 'manual') {
				if (purpose.amount >= 0) {
					incomePurposes.push(purpose);
				} else {
					expensePurposes.push(purpose);
				}
			} else if (purpose.type === 'addon') {
				donationPurposes.push(purpose);
			} else if (purpose.type === 'trigger') {
				if (purpose.triggers === 'registration_entry') {
					registrationPurposes.push(purpose);
				}
			}
		}

		let expenseRows = expensePurposes.map(purpose => {
			return [
				{
					text: purpose.title,
					margin: [ 15, 0, 0, 0 ],
				},
				{
					text: formatCurrency(purpose.amount, paymentIntent.currency),
					alignment: 'right',
				},
			];
		});
		if (!expenseRows.length) {
			expenseRows = [
				[
					{
						text: 'Neniuj elspezoj',
						italics: true,
						colSpan: 2,
					},
					null
				]
			];
		}

		let incomeRows = incomePurposes.map(purpose => {
			return [
				{
					text: purpose.title,
					margin: [ 15, 0, 0, 0 ],
				},
				{
					text: formatCurrency(purpose.amount, paymentIntent.currency),
					alignment: 'right',
				},
			];
		});
		if (!incomeRows.length) {
			incomeRows = [
				[
					{
						text: 'Neniuj aliaj enspezoj',
						italics: true,
						colSpan: 2,
					},
					null
				]
			];
		}

		let donationRows = donationPurposes.map(purpose => {
			return [
				{
					text: purpose.paymentAddon.name,
					margin: [ 15, 0, 0, 0 ],
				},
				{
					text: formatCurrency(purpose.amount, paymentIntent.currency),
					alignment: 'right',
				}
			];
		});
		if (!donationRows.length) {
			donationRows = [
				[
					{
						text: 'Neniuj donacoj',
						italics: true,
						colSpan: 2,
					},
					null
				]
			];
		}

		const registrationEntriesRaw = await AKSO.db('registration_entries')
			.select('*', {
				offers: 1,
				codeholderData: 1,
			})
			.whereIn('id', registrationPurposes.map(x => x.registrationEntryId));
		await new Promise(resolve => registrationEntryAfterQuery(registrationEntriesRaw, resolve));
		const registrationEntries = arrToObjByKey(
			registrationEntriesRaw
				.map(x => new RegistrationEntryResource(x, {
					query: { fields: Object.keys(registrationEntrySchema.fields) },
				}).obj),
			obj => obj.id.toString('hex'),
		);
		const codeholderIds = Object.values(registrationEntries).flatMap(entries => {
			return entries.flatMap(entry => {
				const ids = [];
				if (typeof entry.codeholderData === 'number') {
					ids.push(entry.codeholderData);
				}
				if (entry.newCodeholderId) {
					ids.push(entry.newCodeholderId);
				}
				return ids;
			});
		});
		const existingCodeholderData = arrToObjByKey(
			await AKSO.db('view_codeholders')
				.select(
					'id',
					'codeholderType',
					'firstName',
					'firstNameLegal',
					'lastName',
					'lastNameLegal',
					'fullName',
					'honorific',
					'newCode',
				)
				.whereIn('id', codeholderIds),
			'id'
		);
		let registrationNetAmount = 0;
		let registrationRows = registrationPurposes.map(purpose => {
			const registrationEntry = registrationEntries[purpose.registrationEntryId.toString('hex')][0];
			let codeholder;
			if (typeof registrationEntry.codeholderData === 'number') {
				codeholder = existingCodeholderData[registrationEntry.codeholderData];
			} else {
				if (registrationEntry.newCodeholderId) {
					codeholder = existingCodeholderData[registrationEntry.newCodeholderId];
				} else {
					codeholder == {
						...registrationEntry.codeholderData,
						newCode: '//////'
					};
				}
			}
			codeholder = codeholder[0];
			const name = formatCodeholderName(codeholder);

			const netAmount = 0; // TODO
			registrationNetAmount += netAmount;

			return [
				{
					text: [
						{
							text: ` ${codeholder.newCode} `,
							font: 'Courier',
							color: '#31a64f',
							background: '#fff',
						},
						'  ',
						name,
					],
					margin: [ 15, 0, 0, 0 ],
				},
				{
					text: '(' + formatCurrency(purpose.amount, paymentIntent.currency) + ')',
					alignment: 'right',
				},
				{
					text: formatCurrency(netAmount, paymentIntent.currency),
					alignment: 'right',
				},
			];
		});
		if (!registrationRows.length) {
			registrationRows = [
				[
					{
						text: 'Neniuj aliĝoj',
						italics: true,
						colSpan: 3,
					},
					null,
					null,
				]
			];
		}

		const tableLayout = {
			defaultBorder: false,
			paddingLeft: i => {
				if (i === 0) { return 8; }
				return 4;
			},
			paddingRight: i => {
				if (i === 0) { return 8; }
				return 0;
			},
			fillColor: i => {
				if (i === 0) { return '#777'; }
				return (i % 2 === 0) ? '#ccc' : '#eee';
			}
		};

		const registrationSum = registrationPurposes.map(x => x.amount).reduce((a, b) => a + b, 0);
		const donationSum = donationPurposes.map(x => x.amount).reduce((a, b) => a + b, 0);
		const otherIncomeSum = incomePurposes.map(x => x.amount).reduce((a, b) => a + b, 0);
		const otherExpensesSum = expensePurposes.map(x => x.amount).reduce((a, b) => a + b, 0);
		let totalNetAmount = registrationNetAmount
			+ donationSum
			+ otherIncomeSum
			+ otherExpensesSum;

		const summaryTableBody = [
			[{
				table: {
					widths: [ '*', 'auto', 'auto' ],
					headerRows: 1,
					body: [
						[{
							text: 'Aliĝoj',
							bold: true, colSpan: 3, color: '#fff'
						}, null, null],
						...registrationRows,
					],
				},
				layout: tableLayout,
				colSpan: 2,
			}, null],
			[
				{
					text: 'MALNETA SUMO de la ALIĜOJ:',
					italics: true,
					alignment: 'right',
				},
				{
					text: '(' + formatCurrency(registrationSum, paymentIntent.currency) + ')',
					alignment: 'right',
				},
			],
			[
				{
					text: 'NETA SUMO de la ALIĜOJ:',
					alignment: 'right',
					margin: [ 0, 0, 0, 24 ],
				},
				{
					text: formatCurrency(registrationNetAmount, paymentIntent.currency),
					decoration: 'underline',
					alignment: 'right',
				},
			],
			[{
				table: {
					widths: [ '*', '*' ],
					headerRows: 1,
					body: [
						[ { text: 'Donacoj (sen depreno)', bold: true, colSpan: 2, color: '#fff' }, null ],
						...donationRows,
					],
				},
				layout: tableLayout,
				colSpan: 2,
			}, null],
			[
				{
					text: 'SUMO de la DONACOJ:',
					alignment: 'right',
					margin: [ 0, 0, 0, 24 ],
				},
				{
					text: formatCurrency(donationSum, paymentIntent.currency),
					decoration: 'underline',
					alignment: 'right',
				},
			],
			[{
				table: {
					widths: [ '*', '*' ],
					headerRows: 1,
					body: [
						[ { text: 'Aliaj enspezoj (sen depreno)', bold: true, colSpan: 2, color: '#fff' }, null ],
						...incomeRows,
					],
				},
				layout: tableLayout,
				colSpan: 2,
			}, null],
			[
				{
					text: [
						'SUMO de la ALIAJ ',
						{ text: 'EN', bold: true },
						'SPEZOJ: ',
					],
					alignment: 'right',
					margin: [ 0, 0, 0, 24 ],
				},
				{
					text: formatCurrency(otherIncomeSum, paymentIntent.currency),
					decoration: 'underline',
					alignment: 'right',
				},
			],
			[{
				table: {
					widths: [ '*', '*' ],
					headerRows: 1,
					body: [
						[ { text: 'Elspezoj aprobitaj de la Ĝenerala Direktoro', bold: true, colSpan: 2, color: '#fff' }, null ],
						...expenseRows,
					],
				},
				layout: tableLayout,
				colSpan: 2,
			}, null],
			[
				{
					text: [
						'SUMO de la ',
						{ text: 'EL', bold: true },
						'SPEZOJ: ',
					],
					alignment: 'right',
					margin: [ 0, 0, 0, 24 ],
				},
				{
					text: formatCurrency(otherExpensesSum, paymentIntent.currency),
					decoration: 'underline',
					alignment: 'right',
				},
			],
			[
				{
					text: 'MALNETA SUMO de la Spezfolio',
					bold: true,
					fillColor: '#777',
					margin: [ 12, 0, 0, 0 ],
					color: '#fff',
				},
				{
					text: '(' + formatCurrency(totalGrossAmount, paymentIntent.currency) + ')',
					alignment: 'right',
					fillColor: '#777',
					margin: [ 0, 0, 12, 0 ],
					color: '#fff',
				}
			],
			[
				{
					text: 'NETA SUMO de la Spezfolio',
					bold: true,
					fillColor: '#777',
					margin: [ 12, 0, 0, 0 ],
					color: '#fff',
				},
				{
					text: formatCurrency(totalNetAmount, paymentIntent.currency),
					decoration: 'underline',
					decorationStyle: 'double',
					alignment: 'right',
					fillColor: '#777',
					margin: [ 0, 0, 12, 0 ],
					color: '#fff',
				}
			],
		];

		const docDefinition = {
			info: {
				title,
				author: 'AKSO',
			},
			pageSize: 'A4',
			pageMargins: [ 20, 20, 20, 100 ],
			defaultStyle: {
				font: 'Arial',
			},
			styles: {
				h1: {
					fontSize: 22,
					bold: true,
					alignment: 'center',
				},
				h2: {
					fontSize: 18,
					bold: true,
					alignment: 'center',
					margin: [ 10, 15, 10, 5 ],
				},
			},

			footer: function(currentPage, pageCount, pageSize) {
				return [
					{
						// hr
						canvas: [{ type: 'line', x1: 20, y1: 0, x2: pageSize.width-20, y2: 0, lineWidth: 0.5 }],
					},
					{
						margin: 20,
						columns: [
							{
								image: path.join(AKSO.dir, 'data/img/logo.png'),
								width: 40,
								margin: [ -5, 0, 10, 0 ],
							},
							{
								margin: [ 0, 10, 0, 0 ],
								columns: [
									{
										text: title,
										width: pageSize.width - 150
									},
									{
										text: `p. ${currentPage} el ${pageCount}`,
										alignment: 'right',
									},
								],
							},
						],
					},
				];
			},

			content: [
				{
					columns: [
						{
							image: path.join(AKSO.dir, 'data/img/logo_text.png'),
							width: 60,
						},
						{
							text: title,
							style: 'h1',
							margin: [ 0, 15, 0, 5 ]
						}
					],
					margin: [ 0, 0, 0, 20 ],
				},
				{
					text: `Submetita de ${sendUser} je ${moment(submissionTime * 1000).format(timeFormat)}.\n` +
						`Aprobita je ${moment(paymentIntent.succeededTime * 1000).format(timeFormat)}.\n` +
						`Printita de ${user} je ${moment().format(timeFormat)}.`,
					italics: true,
				},
				{
					text: 'Resumo',
					style: 'h2',
				},
				{
					layout: 'noBorders',
					table: {
						body: summaryTableBody,
						widths: [ '*', 'auto' ],
					},
					margin: [ 0, 12, 0, 0 ],
				},
			],
		};

		res.status(200).type('application/pdf');
		const pdfDoc = printer.createPdfKitDocument(docDefinition);
		pdfDoc.on('end', () => res.end());
		pdfDoc.pipe(res);
		pdfDoc.end();
	}
};
