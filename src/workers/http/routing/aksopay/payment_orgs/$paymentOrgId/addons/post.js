import path from 'path';

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
			required: [
				'name'
			],
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		// Make sure the payment org exists and is accessible
		const paymentOrg = await AKSO.db('pay_orgs')
			.where('id', req.params.paymentOrgId)
			.first('org');
		if (!paymentOrg) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_addons.create.' + paymentOrg.org)) {
			return res.sendStatus(403);
		}

		const id = (await AKSO.db('pay_addons').insert({
			paymentOrgId: req.params.paymentOrgId,
			...req.body
		}))[0];

		res.set('Location', path.join(
			AKSO.conf.http.path,
			'aksopay/payment_orgs',
			req.params.paymentOrgId,
			'addons',
			id.toString()
		));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
