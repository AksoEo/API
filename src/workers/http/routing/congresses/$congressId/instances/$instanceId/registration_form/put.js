import AKSOCurrency from 'akso/lib/enums/akso-currency';
import { insertAsReplace } from 'akso/util';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				allowUse: {
					type: 'boolean'
				},
				allowGuests: {
					type: 'boolean'
				},
				price: {
					type: 'object',
					nullable: true,
					properties: {
						currency: {
							type: 'string',
							enum: AKSOCurrency.all
						},
						var: { // TODO: Make sure this var exists
							type: 'string',
							minLength: 1,
							maxLength: 40
						},
						minUpfront: {
							type: 'integer',
							format: 'uint32',
							nullable: true
						}
					},
					required: [
						'currency',
						'var'
					],
					additionalProperties: false
				},
				form: { // TODO: Validate
					type: 'array',
					maxItems: 256,
					items: {
						type: 'object'
					}
				}
			},
			required: [
				'form'
			],
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const orgData = await AKSO.db('congresses')
			.innerJoin('congresses_instances', 'congressId', 'congresses.id')
			.where({
				congressId: req.params.congressId,
				'congresses_instances.id': req.params.instanceId
			})
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('congress_instances.update.' + orgData.org)) { return res.sendStatus(403); }

		await insertAsReplace(AKSO.db('congresses_instances_registrationForm')
			.insert({
				congressInstanceId: req.params.instanceId,
				allowUse: req.body.allowUse,
				allowGuests: req.body.allowGuests,
				form: JSON.stringify(req.body.form),
				price_currency: req.body.price ? req.body.price.currency : null,
				price_var: req.body.price ? req.body.price.var : null,
				price_minUpfront: req.body.price ? req.body.price.minUpfront : null
			}));

		res.sendStatus(204);
	}
};
