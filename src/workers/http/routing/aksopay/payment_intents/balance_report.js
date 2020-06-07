import QueryUtil from 'akso/lib/query-util';
import AKSOOrganization from 'akso/lib/enums/akso-organization';
import AKSOCurrency from 'akso/lib/enums/akso-currency';

import { schema as parSchema } from './schema';

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

const schema = {
	...parSchema,
	...{
		query: [
			'filter', 'currency', 'time'
		],
		body: null
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
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

		// Check perms
		const orgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('pay.payment_intents.read.' + org));
		if (!orgs.length) { return res.sendStatus(403); }

		const baseQuery = AKSO.db('pay_intents')
			.whereIn('org', orgs);
		QueryUtil.simpleCollection(req, schema, baseQuery);
		baseQuery
			.clearSelect()
			.limit(Number.MAX_SAFE_INTEGER)
			.offset(0);

		const response = {
			converted: null,
			totals: {
				currency: {},
				paymentMethod: {}
			}
		};

		// By currency
		const totalEarnedQuery = baseQuery
			.clone()
			.whereBetween('succeededTime', timeRange)
			.sum({ s: 'totalAmount' })
			.count({ c: 'totalAmount' })
			.select('currency')
			.groupBy('currency');
		const totalEarned = await totalEarnedQuery;

		for (const totalEarnedRow of totalEarned) {
			// These are strings for whatever reason
			totalEarnedRow.s = parseInt(totalEarnedRow.s, 10);
			totalEarnedRow.c = parseInt(totalEarnedRow.c, 10);

			response.totals.currency[totalEarnedRow.currency] = {
				earned: totalEarnedRow.s,
				refunded: 0,
				total: totalEarnedRow.s,
				count: totalEarnedRow.c,
				refunds: 0
			};
		}

		const totalRefundedQuery = baseQuery
			.clone()
			.whereBetween('refundedTime', timeRange)
			.sum({ s: 'totalAmount' })
			.count({ c: 'amountRefunded' })
			.select('currency')
			.groupBy('currency');
		const totalRefunded = await totalRefundedQuery;

		for (const totalRefundedRow of totalRefunded) {
			// These are strings for whatever reason
			totalRefundedRow.s = parseInt(totalRefundedRow.s, 10);
			totalRefundedRow.c = parseInt(totalRefundedRow.c, 10);

			if (!(totalRefundedRow.currency in response.totals.currency)) {
				response.totals.currency[totalRefundedRow.currency] = {
					earned: 0,
					total: 0,
					count: 0
				};
			}

			response.totals.currency[totalRefundedRow.currency] = {
				...response.totals.currency[totalRefundedRow.currency],
				refunded: totalRefundedRow.s,
				total: response.totals.currency[totalRefundedRow.currency].earned - totalRefundedRow.s,
				refunds: totalRefundedRow.c
			};
		}
		response.refunds = totalRefunded.c;

		// Converted (global)
		if (req.query.currency) {
			let totalConverted = 0,
				earnedConverted = 0,
				refundedConverted = 0;
			for (const [ currency, currencyObj ] of Object.entries(response.totals.currency)) {
				totalConverted += convertCurrency(currency, req.query.currency, currencyObj.total);
				earnedConverted += convertCurrency(currency, req.query.currency, currencyObj.earned);
				refundedConverted += convertCurrency(currency, req.query.currency, currencyObj.refunded);
			}
			response.converted = {
				total: totalConverted,
				earned: earnedConverted,
				refunded: refundedConverted
			};
		}

		// By payment method
		const totalEarnedByMethodQuery = baseQuery
			.clone()
			.whereBetween('succeededTime', timeRange)
			.sum({ s: 'totalAmount' })
			.count({ c: 'totalAmount' })
			.select('currency', 'paymentOrgId', 'paymentMethodId')
			.groupBy('currency', 'paymentMethodId', 'paymentOrgId');
		const totalEarnedByMethod = await totalEarnedByMethodQuery;

		for (const totalEarnedRow of totalEarnedByMethod) {
			// These are strings for whatever reason
			totalEarnedRow.s = parseInt(totalEarnedRow.s, 10);
			totalEarnedRow.c = parseInt(totalEarnedRow.c, 10);

			if (!(totalEarnedRow.paymentOrgId in response.totals.paymentMethod)) {
				response.totals.paymentMethod[totalEarnedRow.paymentOrgId] = {};
			}
			if (!(totalEarnedRow.paymentMethodId in response.totals.paymentMethod[totalEarnedRow.paymentOrgId])) {
				response.totals.paymentMethod[totalEarnedRow.paymentOrgId][totalEarnedRow.paymentMethodId] = { totals: {} };
			}

			const obj = response.totals.paymentMethod[totalEarnedRow.paymentOrgId][totalEarnedRow.paymentMethodId].totals;
			obj[totalEarnedRow.currency] = {
				earned: totalEarnedRow.s,
				total: totalEarnedRow.s,
				refunded: 0,
				count: totalEarnedRow.c,
				refunds: 0
			};
		}

		const totalRefundedByMethodQuery = baseQuery
			.clone()
			.whereBetween('refundedTime', timeRange)
			.sum({ s: 'totalAmount' })
			.count({ c: 'totalAmount' })
			.select('currency', 'paymentOrgId', 'paymentMethodId')
			.groupBy('currency', 'paymentMethodId', 'paymentOrgId');
		const totalRefundedByMethod = await totalRefundedByMethodQuery;

		for (const totalRefundedRow of totalRefundedByMethod) {
			// These are strings for whatever reason
			totalRefundedRow.s = parseInt(totalRefundedRow.s, 10);
			totalRefundedRow.c = parseInt(totalRefundedRow.c, 10);

			if (!(totalRefundedRow.paymentOrgId in response.totals.paymentMethod)) {
				response.totals.paymentMethod[totalRefundedRow.paymentOrgId] = {};
			}
			if (!(totalRefundedRow.paymentMethodId in response.totals.paymentMethod[totalRefundedRow.paymentOrgId])) {
				response.totals.paymentMethod[totalRefundedRow.paymentOrgId][totalRefundedRow.paymentMethodId] = { totals: {} };
			}
			const obj = response.totals.paymentMethod[totalRefundedRow.paymentOrgId][totalRefundedRow.paymentMethodId].totals;

			if (!(totalRefundedRow.currency in obj)) {
				obj[totalRefundedRow.currency] = {
					earned: 0,
					total: 0,
					count: 0
				};
			}

			obj[totalRefundedRow.currency] = {
				...obj[totalRefundedRow.currency],
				refunded: totalRefundedRow.s,
				total: obj[totalRefundedRow.currency].total - totalRefundedRow.s,
				refunds: totalRefundedRow.c
			};
		}

		res.sendObj(response);
	}
};
