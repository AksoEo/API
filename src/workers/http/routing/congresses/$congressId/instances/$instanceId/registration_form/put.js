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
						var: {
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
			]),
			'@is_member': new ConcreteType(ConcreteType.types.BOOL)
		};
		let parsedForm;
		try {
			parsedForm = parseForm(req.body.form, formValues);
		} catch (e) {
			e.statusCode = 400;
			throw e;
		}
 
		if (req.body.price) {
			// Validate price var
			try {
				parsedForm.validateDefinition(req.body.price.var);
			} catch (e) {
				const err = new Error(`The AKSO Script for the price variable ${req.body.price.var} errored: ${e.message}`);
				err.statusCode = 400;
				throw err;
			}
		}

		// Create Form if t doesn't already exists
		const existingRegistrationForm = await AKSO.db('congresses_instances_registrationForm')
			.where('congressInstanceId', req.params.instanceId)
			.first('formId');
		let formId;
		if (existingRegistrationForm) {
			formId = existingRegistrationForm.formId;
		} else {
			formId = (await AKSO.db('forms').insert({}))[0];
		}

		// Populate forms_fields
		// TODO: This will not work with data migration
		const formFieldInsertQueries = [];
		for (const formEntry of req.body.form) {
			if (formEntry.el !== 'input') { continue; }
			formFieldInsertQueries.push(
				insertAsReplace(
					AKSO.db('forms_fields')
						.insert({
							formId,
							name: formEntry.name,
							type: formEntry.type
						})
				));
		}
		await Promise.all(formFieldInsertQueries);

		const data = {
			allowUse: req.body.allowUse,
			allowGuests: req.body.allowGuests,
			form: JSON.stringify(req.body.form),
			price_currency: req.body.price ? req.body.price.currency : null,
			price_var: req.body.price ? req.body.price.var : null,
			price_minUpfront: req.body.price ? req.body.price.minUpfront : null,
			formId
		};
		if (existingRegistrationForm) {
			await AKSO.db('congresses_instances_registrationForm')
				.where('congressInstanceId', req.params.instanceId)
				.update(data);
		} else {
			await AKSO.db('congresses_instances_registrationForm')
				.insert({
					...data,
					congressInstanceId: req.params.instanceId
				});
		}

		res.sendStatus(204);
	}
};
