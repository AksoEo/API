export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 64,
					pattern: '^[^\\n]+$'
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 5000,
					nullable: true
				}
			},
			minProperties: 1,
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		// Make sure the payment org exists and is accessible
		const paymentOrg = await AKSO.db('pay_orgs')
			.where('id', req.params.paymentOrgId)
			.first('org');
		if (!paymentOrg) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_addons.update.' + paymentOrg.org)) {
			return res.sendStatus(403);
		}

		const updated = await AKSO.db('pay_addons')
			.where({
				id: req.params.paymentAddonId,
				paymentOrgId: req.params.paymentOrgId
			})
			.update(req.body);

		res.sendStatus(updated ? 204 : 404);
	}
};
