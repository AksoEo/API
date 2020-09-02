import AKSOOrganization from 'akso/lib/enums/akso-organization';
import AKSOCurrency from 'akso/lib/enums/akso-currency';

function convertCurrency (curFrom, curTo, amount) {
	if (typeof amount !== 'number') { amount = parseInt(amount, 10); }
	if (curFrom === curTo) { return amount; }

	const factorFrom = AKSOCurrency.getZeroDecimalFactor(curFrom);
	const factorTo = AKSOCurrency.getZeroDecimalFactor(curTo);

	return Math.round(
		AKSO.cashify.convert(amount / factorFrom, { from: curFrom, to: curTo }) *
			factorTo
	);
}

function getConvertedReportTotals (req, byCurrency, isInvalid = false) {
	let converted = null;
	if (req.query.currency) {
		converted = {
			total: 0,
			earned: 0
		};
		if (isInvalid) {
			converted.invalidated = 0;
		} else {
			converted.refunded = 0;
		}

		for (const [currency, currencyObj] of Object.entries(byCurrency)) {
			converted.total += convertCurrency(currency, req.query.currency, currencyObj.total);
			converted.earned += convertCurrency(currency, req.query.currency, currencyObj.earned);
			if (isInvalid) {
				converted.invalidated += convertCurrency(currency, req.query.currency, currencyObj.invalidated);
			} else {
				converted.refunded += convertCurrency(currency, req.query.currency, currencyObj.refunded);
			}
		}
	}

	return converted;
}

export default {
	schema: {
		query: [
			'currency', 'time'
		],
		body: null
	},

	run: async function run (req, res) {
		// Check perms
		const orgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('pay.payment_intents.read.' + org));
		if (!orgs.length) { return res.sendStatus(403); }

		// Validate ?currency
		if ('currency' in req.query && !AKSOCurrency.has(req.query.currency)) {
			const err = new Error('Unknown ?currency');
			err.statusCode = 400;
			throw err;
		}

		// Validate ?time
		if (!('time' in req.query)) {
			const err = new Error('?time is required');
			err.statusCode = 400;
			throw err;
		}
		const timeRegex = /^(\d{1,10})-(\d{1,10})$/;
		const timeBits = req.query.time.match(timeRegex);
		if (!timeBits) {
			const err = new Error('Invalid ?time');
			err.statusCode = 400;
			throw err;
		}
		const timeRange = [
			parseInt(timeBits[1], 10),
			parseInt(timeBits[2], 10)
		];

		const response = {
			byCurrency: {},
			byPaymentOrg: {}
		};

		////////////////
		// byCurrency //
		////////////////
		const globalEarnedByCurrency = await AKSO.db('pay_intents')
			.leftJoin('pay_intents_purposes', 'paymentIntentId', '=', 'id')
			.select('currency')
			.countDistinct({ c: 'id' })
			.sum({ s: 'amount' })
			.whereIn('org', orgs)
			.whereBetween('succeededTime', timeRange)
			.groupBy('currency');

		for (const earnedRow of globalEarnedByCurrency) {
			response.byCurrency[earnedRow.currency] = {
				total: parseInt(earnedRow.s, 10),
				earned: parseInt(earnedRow.s, 10),
				count: earnedRow.c,
				refunded: 0,
				refunds: 0
			};
		}

		const globalRefundedByCurrency = await AKSO.db('pay_intents')
			.select('currency')
			.count({ c: 'id' })
			.sum({ s: 'amountRefunded' })
			.whereIn('org', orgs)
			.whereBetween('refundedTime', timeRange)
			.groupBy('currency');

		for (const refundedRow of globalRefundedByCurrency) {
			if (!(refundedRow.currency in response.byCurrency)) {
				response.byCurrency[refundedRow.currency] = {
					total: 0,
					earned: 0,
					count: 0
				};
			}
			response.byCurrency[refundedRow.currency].total -= parseInt(refundedRow.s, 10);
			response.byCurrency[refundedRow.currency].refunded = parseInt(refundedRow.s, 10);
			response.byCurrency[refundedRow.currency].refunds = refundedRow.c;
		}

		///////////////
		// converted //
		///////////////
		response.converted = getConvertedReportTotals(req, response.byCurrency);

		/////////////////////////////
		// byPaymentOrg.byCurrency //
		/////////////////////////////
		const globalEarnedByCurrencyByOrg = await AKSO.db('pay_intents')
			.leftJoin('pay_intents_purposes', 'paymentIntentId', '=', 'id')
			.select('paymentOrgId', 'currency')
			.countDistinct({ c: 'id' })
			.sum({ s: 'amount' })
			.whereIn('org', orgs)
			.whereBetween('succeededTime', timeRange)
			.groupBy('paymentOrgId', 'currency');

		for (const earnedRow of globalEarnedByCurrencyByOrg) {
			if (!(earnedRow.paymentOrgId in response.byPaymentOrg)) {
				response.byPaymentOrg[earnedRow.paymentOrgId] = {
					byCurrency: {},
					byPaymentMethod: {},
					byPaymentAddon: {}
				};
			}
			const byCurrency = response.byPaymentOrg[earnedRow.paymentOrgId].byCurrency;
			byCurrency[earnedRow.currency] = {
				total: parseInt(earnedRow.s, 10),
				earned: parseInt(earnedRow.s, 10),
				count: earnedRow.c,
				refunded: 0,
				refunds: 0
			};
		}

		const globalRefundedByCurrencyByOrg = await AKSO.db('pay_intents')
			.select('paymentOrgId', 'currency')
			.count({ c: 'id' })
			.sum({ s: 'amountRefunded' })
			.whereIn('org', orgs)
			.whereBetween('refundedTime', timeRange)
			.groupBy('paymentOrgId', 'currency');

		for (const refundedRow of globalRefundedByCurrencyByOrg) {
			if (!(refundedRow.paymentOrgId in response.byPaymentOrg)) {
				response.byPaymentOrg[refundedRow.paymentOrgId] = {
					byCurrency: {},
					byPaymentMethod: {},
					byPaymentAddon: {}
				};
			}
			const byCurrency = response.byPaymentOrg[refundedRow.paymentOrgId].byCurrency;
			if (!(refundedRow.currency in byCurrency)) {
				byCurrency[refundedRow.currency] = {
					total: 0,
					earned: 0,
					count: 0
				};
			}
			byCurrency[refundedRow.currency].total -= parseInt(refundedRow.s, 10);
			byCurrency[refundedRow.currency].refunded = parseInt(refundedRow.s, 10);
			byCurrency[refundedRow.currency].refunds = refundedRow.c;
		}

		////////////////////////////
		// byPaymentOrg.converted //
		////////////////////////////
		for (const orgObj of Object.values(response.byPaymentOrg)) {
			orgObj.converted = getConvertedReportTotals(req, orgObj.byCurrency);
		}

		/////////////////////////////////////////////
		// byPaymentOrg.byPaymentMethod.byCurrency //
		/////////////////////////////////////////////
		const globalEarnedByCurrencyByOrgByMethod = await AKSO.db('pay_intents')
			.leftJoin('pay_intents_purposes', 'paymentIntentId', '=', 'id')
			.select('paymentMethodId', 'paymentOrgId', 'currency')
			.countDistinct({ c: 'id' })
			.sum({ s: 'amount' })
			.whereIn('org', orgs)
			.whereBetween('succeededTime', timeRange)
			.groupBy('paymentMethodId', 'paymentOrgId', 'currency');

		for (const earnedRow of globalEarnedByCurrencyByOrgByMethod) {
			const byPaymentMethod = response.byPaymentOrg[earnedRow.paymentOrgId].byPaymentMethod;
			if (!(earnedRow.paymentMethodId in byPaymentMethod)) {
				byPaymentMethod[earnedRow.paymentMethodId] = {
					byCurrency: {}
				};
			}
			const byCurrency = byPaymentMethod[earnedRow.paymentMethodId].byCurrency;
			byCurrency[earnedRow.currency] = {
				total: parseInt(earnedRow.s, 10),
				earned: parseInt(earnedRow.s, 10),
				count: earnedRow.c,
				refunded: 0,
				refunds: 0
			};
		}

		const globalRefundedByCurrencyByOrgByMethod = await AKSO.db('pay_intents')
			.select('paymentMethodId', 'paymentOrgId', 'currency')
			.count({ c: 'id' })
			.sum({ s: 'amountRefunded' })
			.whereIn('org', orgs)
			.whereBetween('refundedTime', timeRange)
			.groupBy('paymentMethodId', 'paymentOrgId', 'currency');

		for (const refundedRow of globalRefundedByCurrencyByOrgByMethod) {
			const byPaymentMethod = response.byPaymentOrg[refundedRow.paymentOrgId].byPaymentMethod;
			if (!(refundedRow.paymentMethodId in byPaymentMethod)) {
				byPaymentMethod[refundedRow.paymentMethodId] = {
					byCurrency: {}
				};
			}
			const byCurrency = byPaymentMethod[refundedRow.paymentMethodId].byCurrency;
			if (!(refundedRow.currency in byCurrency)) {
				byCurrency[refundedRow.currency] = {
					total: 0,
					earned: 0,
					count: 0
				};
			}
			byCurrency[refundedRow.currency].total -= parseInt(refundedRow.s, 10);
			byCurrency[refundedRow.currency].refunded = parseInt(refundedRow.s, 10);
			byCurrency[refundedRow.currency].refunds = refundedRow.c;
		}

		////////////////////////////////////////////
		// byPaymentOrg.byPaymentMethod.converted //
		////////////////////////////////////////////
		for (const orgObj of Object.values(response.byPaymentOrg)) {
			for (const methodObj of Object.values(orgObj.byPaymentMethod)) {
				methodObj.converted = getConvertedReportTotals(req, methodObj.byCurrency);
			}
		}

		////////////////////////////////////////////
		// byPaymentOrg.byPaymentAddon.byCurrency //
		////////////////////////////////////////////
		const globalEarnedByCurrencyByOrgByAddon = await AKSO.db('pay_intents')
			.leftJoin('view_pay_intents_purposes', 'paymentIntentId', '=', 'id')
			.select('paymentAddonId', 'paymentOrgId', 'currency')
			.countDistinct({ c: 'id' })
			.sum({ s: 'amount' })
			.whereIn('org', orgs)
			.whereBetween('succeededTime', timeRange)
			.where('view_pay_intents_purposes.type', 'addon')
			.where('invalid', false)
			.groupBy('paymentAddonId', 'paymentOrgId', 'currency');

		for (const earnedRow of globalEarnedByCurrencyByOrgByAddon) {
			const byPaymentAddon = response.byPaymentOrg[earnedRow.paymentOrgId].byPaymentAddon;
			if (!(earnedRow.paymentAddonId in byPaymentAddon)) {
				byPaymentAddon[earnedRow.paymentAddonId] = {
					byCurrency: {}
				};
			}
			const byCurrency = byPaymentAddon[earnedRow.paymentAddonId].byCurrency;
			byCurrency[earnedRow.currency] = {
				total: parseInt(earnedRow.s, 10),
				earned: parseInt(earnedRow.s, 10),
				count: earnedRow.c,
				invalidated: 0,
				invalidations: 0
			};
		}

		const globalInvalidatedByCurrencyByOrgByAddon = await AKSO.db('pay_intents')
			.leftJoin('view_pay_intents_purposes', 'paymentIntentId', '=', 'id')
			.select('paymentAddonId', 'paymentOrgId', 'currency')
			.countDistinct({ c: 'id' })
			.sum({ s: 'amount' })
			.whereIn('org', orgs)
			.whereBetween('succeededTime', timeRange)
			.where('view_pay_intents_purposes.type', 'addon')
			.where('invalid', true)
			.groupBy('paymentAddonId', 'paymentOrgId', 'currency');

		for (const invalidatedRow of globalInvalidatedByCurrencyByOrgByAddon) {
			const byPaymentAddon = response.byPaymentOrg[invalidatedRow.paymentOrgId].byPaymentAddon;
			if (!(invalidatedRow.paymentAddonId in byPaymentAddon)) {
				byPaymentAddon[invalidatedRow.paymentAddonId] = {
					byCurrency: {}
				};
			}
			const byCurrency = byPaymentAddon[invalidatedRow.paymentAddonId].byCurrency;
			if (!(invalidatedRow.currency in byCurrency)) {
				byCurrency[invalidatedRow.currency] = {
					total: 0,
					earned: 0,
					count: 0
				};
			}
			byCurrency[invalidatedRow.currency].total -= parseInt(invalidatedRow.s, 10);
			byCurrency[invalidatedRow.currency].invalidated = parseInt(invalidatedRow.s, 10);
			byCurrency[invalidatedRow.currency].invalidations = invalidatedRow.c;
		}

		///////////////////////////////////////////
		// byPaymentOrg.byPaymentAddon.converted //
		///////////////////////////////////////////
		for (const orgObj of Object.values(response.byPaymentOrg)) {
			for (const addonObj of Object.values(orgObj.byPaymentAddon)) {
				addonObj.converted = getConvertedReportTotals(req, addonObj.byCurrency, true);
			}
		}

		res.sendObj(response);
	}
};
