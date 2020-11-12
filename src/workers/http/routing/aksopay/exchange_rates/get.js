import AKSOCurrency from 'akso/lib/enums/akso-currency';

export default {
	schema: {
		body: null,
		query: {
			properties: {
				base: {
					type: 'string',
					enum: AKSOCurrency.all
				}
			},
			required: [ 'base' ],
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		if (!AKSO.cashify) { return res.sendStatus(423); }

		const rates = {};
		for (const cur of AKSOCurrency.all) {
			const curFactor = AKSOCurrency.getZeroDecimalFactor(cur);
			rates[cur] = Math.round(
				AKSO.cashify.convert(100, { from: req.query.base, to: cur }) *
					curFactor
			);
		}

		res.sendObj(rates);
	}
};
