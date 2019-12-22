import AKSOCurrency from 'akso/lib/enums/akso-currency';
import { insertAsReplace } from 'akso/util';
import { formSchema, parseForm } from 'akso/workers/http/lib/form-util';
import { UnionType, ConcreteType } from '@tejo/akso-script';

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
				form: formSchema
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

		// Validate the form
		const formValues = {
			'@upfront_time': new UnionType([
				new ConcreteType(ConcreteType.types.NULL),
				new ConcreteType(ConcreteType.types.NUMBER)
			])
		};
		let parsedForm;
		try {
			parsedForm = parseForm(req.body.form, formValues);
		} catch (e) {
			e.statusCode = 400;
			throw e;
		}

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
