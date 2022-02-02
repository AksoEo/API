import AKSOCurrency from 'akso/lib/enums/akso-currency';

export default {
	schema: {
		body: null,
		query: {
			type: 'object',
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
			rates[cur] = AKSO.cashify.convert(1, { from: req.query.base, to: cur });
		}

		res.sendObj(rates);
	}
};
