import PdfPrinter from 'pdfmake';
import path from 'path';
import moment from 'moment-timezone';
import { default as deepmerge } from 'deepmerge';

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
	STIXTwoMath: {
		normal: path.join(AKSO.dir, 'data/fonts/STIXTwoMath.ttf'),
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
					if (purpose.registrationEntryId !== null) {
						registrationPurposes.push(purpose);
					}
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
						margin: [ 15, 0, 0, 0 ],
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
						margin: [ 15, 0, 0, 0 ],
					},
					null
				]
			];
		}

		let donationRows = donationPurposes.map(purpose => {
			return [
				{
					text: [
						purpose.paymentAddon.name,
						{
							text: purpose.description ? '\n' + purpose.description : '',
							italics: true
						}
					],
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
			.whereIn(
				'id',
				registrationPurposes.map(x => x.registrationEntryId) ?? []
			);
		await new Promise(resolve => registrationEntryAfterQuery(registrationEntriesRaw, resolve));
		const registrationEntries = arrToObjByKey(
			registrationEntriesRaw
				.map(x => new RegistrationEntryResource(x, {
					query: { fields: Object.keys(registrationEntrySchema.fields) },
				}).obj),
			obj => obj.id.toString('hex'),
		);
		let codeholderIds = [];
		let magazineIds = [];
		let membershipCategoryIds = [];
		for (const entries of Object.values(registrationEntries)) {
			for (const entry of entries) {
				if (typeof entry.codeholderData === 'number') {
					codeholderIds.push(entry.codeholderData);
				}
				if (entry.newCodeholderId) {
					codeholderIds.push(entry.newCodeholderId);
				}

				for (const offer of entry.offers) {
					if (offer.type === 'membership') {
						membershipCategoryIds.push(offer.id);
					} else if (offer.type === 'magazine') {
						magazineIds.push(offer.id);
					}
				}
			}
		}
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
		const magazineData = arrToObjByKey(
			await AKSO.db('magazines')
				.select('id', 'name')
				.whereIn('id', magazineIds),
			'id'
		);
		const membershipCategoryData = arrToObjByKey(
			await AKSO.db('membershipCategories')
				.select('id', 'nameAbbrev')
				.whereIn('id', membershipCategoryIds),
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

			let netAmount = registrationEntry.offers
				.map(offer => {
					const year = paymentIntent.paymentMethod.prices[paymentIntent.intermediaryIdentifier.year];
					let commission = 0;
					const offerType = offer.type === 'membership' ?
						'membershipCategories' :
						'magazines';
					if (year) {
						for (const priceObj of year.registrationEntries[offerType]) {
							if (priceObj.id !== offer.id) { continue; }
							if (offer.type === 'membership') { commission = priceObj.commission; }
							else if (offer.type === 'magazine') {
								const accessType = offer.paperVersion ?
									'paper' : 'access';
								commission = priceObj.prices[accessType];
								if (commission === null) { commission = 0; }
								else {
									commission = commission.commission;
								}
							}
							break;
						}
					}
					offer._commission = commission;
					offer._netAmount = ((100 - commission) / 100) * offer.amount;
					return offer._netAmount;
				})
				.reduce((a, b) => a + b, 0);

			registrationNetAmount += netAmount;

			return [
				{
					stack: [
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
						},
						{
							layout: 'noBorders',
							table: {
								body: registrationEntry.offers.map(offer => {
									let offerTitle;
									if (offer.type === 'membership') {
										offerTitle = `${membershipCategoryData[offer.id][0].nameAbbrev}`;
									} else if (offer.type === 'magazine') {
										offerTitle = `${offer.paperVersion ? 'Papera' : 'Reta'} revuo ${magazineData[offer.id][0].name}`;
									}

									return [
										{
											text: offer._commission + '%',
											alignment: 'right',
										},
										offerTitle,
										{
											text: '(' + formatCurrency(offer.amount, paymentIntent.currency) + ')',
											alignment: 'right',
										},
										{
											text: formatCurrency(offer._netAmount, paymentIntent.currency),
											alignment: 'right',
										},
									];
								}),
								widths: [ 'auto', 80, 'auto', 'auto' ],
							},
						}
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
						margin: [ 15, 0, 0, 0 ],
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
				return 2;
			},
			paddingRight: i => {
				if (i === 0) { return 8; }
				return 2;
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
					text: 'SUMA DEPRENO de la Spezfolio',
					bold: true,
					fillColor: '#777',
					margin: [ 12, 0, 0, 0 ],
					color: '#fff',
				},
				{
					text: '-(' + formatCurrency(totalGrossAmount - totalNetAmount, paymentIntent.currency) + ')',
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

		const registrationEntryOverviewData = {};
		for (const purpose of registrationPurposes) {
			const registrationEntry = registrationEntries[purpose.registrationEntryId.toString('hex')][0];
			for (const offer of registrationEntry.offers) {
				if (!(offer._commission in registrationEntryOverviewData)) {
					registrationEntryOverviewData[offer._commission] = {
						magazines: {},
						membershipCategories: {},
					};
				}
				const commissionObj = registrationEntryOverviewData[offer._commission];
				
				let offerIdObj = {};
				if (offer.type === 'magazine') {
					if (!(offer.id in commissionObj.magazines)) {
						commissionObj.magazines[offer.id] = {};
					}
					offerIdObj = commissionObj.magazines[offer.id];
				} else if (offer.type === 'membership') {
					if (!(offer.id in commissionObj.membershipCategories)) {
						commissionObj.membershipCategories[offer.id] = {};
					}
					offerIdObj = commissionObj.membershipCategories[offer.id];
				}

				if (!(offer.amount in offerIdObj)) {
					offerIdObj[offer.amount] = [];
				}
				offerIdObj[offer.amount].push(offer);
			}
		}

		const registrationEntryOverview = Object.entries(registrationEntryOverviewData)
			.flatMap(([commission, offers]) => {
				const offersOrdered = [
					...Object.entries(offers.membershipCategories)
						.sort((a, b) => {
							const nameA = membershipCategoryData[a[0]].nameAbbrev;
							const nameB = membershipCategoryData[b[0]].nameAbbrev;
							return nameA.localeCompare(nameB, 'eo');
						})
						.flatMap(x => Object.entries(x[1]))
						.sort((a, b) => {
							return parseInt(a[0], 10) - parseInt(b[0], 10);
						})
						.map(x => x[1])
						.map(x => {
							return {
								obj: x[0],
								count: x.length,
							};
						}),

					...Object.entries(offers.magazines)
						.sort((a, b) => {
							const nameA = magazineData[a[0]].name;
							const nameB = magazineData[b[0]].name;
							return nameA.localeCompare(nameB, 'eo');
						})
						.flatMap(x => Object.entries(x[1]))
						.sort((a, b) => {
							return parseInt(a[0], 10) - parseInt(b[0], 10);
						})
						.map(x => x[1])
						.map(x => {
							return {
								obj: x[0],
								count: x.length,
							};
						})
				];

				const commissionRows = offersOrdered.map((offersObj, i) => {
					const cols = [];
					if (i === 0) {
						cols.push({
							text: commission + '%',
							rowSpan: offersOrdered.length,
							alignment: 'right',
							margin: [
								0,
								offersOrdered.length === 1 ?
									2
									: offersOrdered.length * 11 - 4.5,
								0,
								0
							],
						});
						if (offersOrdered.length === 1) {
							cols.push({
								text: '{',
								font: 'STIXTwoMath',
								fontSize: 20,
								margin: [ 0, 1.5, 0, 0 ],
							});
						} else {
							const lineHeight = offersOrdered.length < 3 ?
								0 : (offersOrdered.length - 2) * 12;
							const canvas = [{
								type: 'line',
								x1: 2.8, y1: 0,
								x2: 2.8, y2: lineHeight,
								lineWidth: 1,
							}];
							cols.push({
								stack: [
									{
										text: '⎧',
										margin: [ 0, 2.5, 0, 0 ],
									},
									{
										canvas: deepmerge([], canvas),
										margin: [ 0, -3, 0, 11 ],
									},
									'⎨',
									{
										canvas: deepmerge([], canvas),
										margin: [ 0, -3, 0, 3 ],
									},
									'⎩',
								],
								font: 'STIXTwoMath',
								fontSize: 10,
								rowSpan: offersOrdered.length,
								margin: [ 0, 6, 14.5, -3 ],
							});
						} 
					} else {
						cols.push(null, null);
					}

					let offerName;
					if (offersObj.obj.type === 'magazine') {
						offerName = `${offersObj.obj.paperVersion ? 'Papera' : 'Reta'} revuo ${magazineData[offersObj.obj.id][0].name}`;
					} else if (offersObj.obj.type === 'membership') {
						offerName = membershipCategoryData[offersObj.obj.id][0].nameAbbrev;
					}

					const margin = [ 0, 2, 2, 0 ];
					cols.push(
						{
							text: offerName,
							margin,
						},
						{
							text: formatCurrency(offersObj.obj.amount, paymentIntent.currency, false),
							margin,
							alignment: 'right',
						},
						{
							text: offersObj.count,
							margin,
							alignment: 'right',
						},
						{
							text: formatCurrency(offersObj.obj.amount * offersObj.count, paymentIntent.currency, false),
							margin,
							alignment: 'right',
						},
						{
							text: formatCurrency((offersObj.obj.amount * offersObj.count) - offersObj.obj._netAmount, paymentIntent.currency, false),
							margin,
							alignment: 'right',
						},
						{
							text: formatCurrency(offersObj.obj._netAmount, paymentIntent.currency),
							margin,
							alignment: 'right',
						},
					);
					return cols;
				});

				return commissionRows;
			});

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
				{
					text: 'Superrigardo de membrokategorioj',
					style: 'h2',
					pageBreak: 'before',
				},
				{
					table: {
						widths: [ '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto' ],
						headerRows: 1,
						heights: 20,
						body: [
							[
								{ text: 'Depreno %', bold: true, color: '#fff', colSpan: 2, alignment: 'right' },
								null,
								{ text: 'Speco', bold: true, color: '#fff' },
								{ text: 'Kotizo', bold: true, color: '#fff' },
								{ text: 'Kvanto', bold: true, color: '#fff' },
								{ text: 'Malneta sumo', bold: true, color: '#fff' },
								{ text: 'Depreno', bold: true, color: '#fff' },
								{ text: 'Neta sumo', bold: true, color: '#fff' },
							],
							...registrationEntryOverview
						],
					},
					layout: tableLayout,
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
