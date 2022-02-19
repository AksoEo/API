import PdfPrinter from 'pdfmake';
import path from 'path';
import moment from 'moment-timezone';

import AKSOPayPaymentIntentResource from 'akso/lib/resources/aksopay-payment-intent-resource';
import { schema, afterQuery } from '../schema';
import { formatCurrency } from 'akso/lib/akso-script-util';

const printer = new PdfPrinter({
	Arial: {
		normal: path.join(AKSO.dir, 'data/fonts/Arial.ttf'),
		bold: path.join(AKSO.dir, 'data/fonts/Arial-Bold.ttf'),
		italics: path.join(AKSO.dir, 'data/fonts/Arial-Italic.ttf'),
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
		const incomeEntries = [];
		const expenseEntries = [];
		let totalAmount = 0;
		for (const purpose of paymentIntent.purposes) {
			totalAmount += purpose.amount;
			if (purpose.type === 'manual') {
				if (purpose.amount >= 0) {
					incomeEntries.push(purpose);
				} else {
					expenseEntries.push(purpose);
				}
			}
		}
		const otherIncomeSum = incomeEntries.map(x => x.amount).reduce((a, b) => a + b, 0);
		const otherExpensesSum = expenseEntries.map(x => x.amount).reduce((a, b) => a + b, 0);
		const summaryTableBody = [
			// TODO: Registration entries
			// TODO: Addons
			[{
				table: {
					widths: [ '*', '*' ],
					headerRows: 1,
					body: [
						[ { text: 'Aliaj enspezoj (sen depreno):', bold: true, colSpan: 2 }, null ],
						...incomeEntries.map(purpose => {
							return [
								{
									text: purpose.title,
								},
								{
									text: formatCurrency(purpose.amount, paymentIntent.currency),
									alignment: 'right',
								},
							];
						}),
					],
				},
				layout: {
					defaultBorder: false,
				},
				colSpan: 2,
			}, null],
			[{
				text: [
					'SUME aliaj ',
					{ text: 'EN', bold: true },
					'SPEZOJ: ',
					{
						text: formatCurrency(otherIncomeSum, paymentIntent.currency),
						decoration: 'underline',
					},
				],
				alignment: 'right',
				colSpan: 2,
			}, null],
			[{
				table: {
					widths: [ '*', '*' ],
					headerRows: 1,
					body: [
						[ { text: 'Elspezoj aprobitaj de la Ĝenerala Direktoro:', bold: true, colSpan: 2 }, null ],
						...expenseEntries.map(purpose => {
							return [
								{
									text: purpose.title,
								},
								{
									text: formatCurrency(purpose.amount, paymentIntent.currency),
									alignment: 'right',
								},
							];
						}),
					],
				},
				layout: {
					defaultBorder: false,
				},
				colSpan: 2,
			}, null],
			[{
				text: [
					'SUMO de la ',
					{ text: 'EL', bold: true },
					'SPEZOJ: ',
					{
						text: formatCurrency(otherExpensesSum, paymentIntent.currency),
						decoration: 'underline',
					},
				],
				alignment: 'right',
				colSpan: 2,
			}, null],
			[
				{
					text: 'NETA SUMO de la Spezfolio: ',
					bold: true,
				},
				{
					text: formatCurrency(totalAmount, paymentIntent.currency),
					decoration: 'underline',
					decorationStyle: 'double',
					alignment: 'right',
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
					text: `Printita de ${user} je ${moment().format(timeFormat)}.\n` +
						`Submetita de ${sendUser} je ${moment(submissionTime * 1000).format(timeFormat)}.\n` +
						`Aprobita je ${moment(paymentIntent.succeededTime * 1000).format(timeFormat)}.`,
					italics: true,
				},
				{
					layout: 'noBorders',
					table: {
						body: summaryTableBody,
						widths: [ '*', 'auto' ],
					},
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
