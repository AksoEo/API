import moment from 'moment';

import { createTransaction, rollbackTransaction, insertAsReplace } from '../../../util';
import { modQuerySchema } from '../../../lib/codeholder-utils';

import { schema as parSchema, memberFilter, memberFieldsManual } from '../schema';

const schema = {
	...parSchema,
	...{
		query: modQuerySchema,
		body: {
			properties: {
				// Codeholder
				newCode: {
					type: 'string',
					pattern: '^[a-z]{6}$'
				},
				address: {
					properties: {
						country: {
							type: 'string',
							pattern: '^[a-z]{2}$'
						},
						countryArea: {
							oneOf: [
								{
									type: 'null'
								},
								{
									type: 'string',
									pattern: '^[^\\n]{1,50}$'
								}
							]
						},
						city: {
							oneOf: [
								{
									type: 'null'
								},
								{
									type: 'string',
									pattern: '^[^\\n]{1,50}$'
								}
							]
						},
						cityArea: {
							oneOf: [
								{
									type: 'null'
								},
								{
									type: 'string',
									pattern: '^[^\\n]{1,50}$'
								}
							]
						},
						streetAddress: {
							oneOf: [
								{
									type: 'null'
								},
								{
									type: 'string',
									minLength: 1,
									maxLength: 100
								}
							]
						},
						postalCode: {
							oneOf: [
								{
									type: 'null'
								},
								{
									type: 'string',
									pattern: '^[^\\n]{1,20}$'
								}
							]
						},
						sortingCode: {
							oneOf: [
								{
									type: 'null'
								},
								{
									type: 'string',
									pattern: '^[^\\n]{1,20}$'
								}
							]
						}
					},
					additionalProperties: false,
					required: [ 'country' ]
				},
				feeCountry: {
					type: 'string',
					pattern: '^[a-z]{2}$'
				},
				email: {
					type: 'string',
					format: 'email',
					minLength: 3,
					maxLength: 200
				},
				enabled: {
					type: 'boolean'
				},
				notes: {
					type: 'string',
					maxLength: 10000
				},
				officePhone: {
					type: 'string',
					format: 'tel'
				},


				// HumanCodeholder
				firstName: {
					type: 'string',
					pattern: '^[^\\n]{1,50}$'
				},
				firstNameLegal: {
					type: 'string',
					pattern: '^[^\\n]{1,50}$'
				},
				lastName: {
					type: 'string',
					pattern: '^[^\\n]{1,50}$'
				},
				lastNameLegal: {
					type: 'string',
					pattern: '^[^\\n]{1,50}$'
				},
				honorific: {
					type: 'string',
					pattern: '^[^\\n]{2,15}$'
				},
				birthdate: {
					type: 'string',
					format: 'date'
				},
				profession: {
					type: 'string',
					pattern: '^[^\\n]{1,50}$'
				},
				landlinePhone: {
					type: 'string',
					format: 'tel'
				},
				cellphone: {
					type: 'string',
					format: 'tel'
				},



				// OrgCodeholder
				fullName: {
					type: 'string',
					pattern: '^[^\\n]{1,100}$'
				},
				fullNameLocal: {
					type: 'string',
					pattern: '^[^\\n]{1,100}$'
				},
				careOf: {
					type: 'string',
					pattern: '^[^\\n]{1,100}$'
				},
				nameAbbrev: {
					type: 'string',
					pattern: '^[^\\n]{1,12}$'
				}
			},
			additionalProperties: false,
			minProperties: 1
		},
		requirePerms: 'codeholders.update'
	}
};

const exclusiveFields = {
	human: [
		'firstName',
		'firstNameLegal',
		'lastName',
		'lastNameLegal',
		'honorific',
		'birthdate',
		'profession',
		'landlinePhone',
		'cellphone'
	],
	org: [
		'fullName',
		'fullNameLocal',
		'careOf',
		'nameAbbrev'
	]
};
exclusiveFields.all = Object.values(exclusiveFields).reduce((a, b) => a.concat(b));

export default {
	schema: schema,

	run: async function run (req, res) {
		// Member fields
		const fields = Object.keys(req.body);
		if (!memberFieldsManual(fields, req, res, 'r')) {
			return res.status(403).type('text/plain').send('Illegal codeholder fields used, check /perms');
		}

		// Generate the member filter lookup before beginning the transaction to reduce latency
		const findCodeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first('codeholderType');
		memberFilter(schema, findCodeholderQuery, req);

		// Ensure that the codeholder exists, is visible through the member filter and is of the right type
		const codeholderBefore = await findCodeholderQuery;
		if (!codeholderBefore) { return res.sendStatus(404); }
		const codeholderType = codeholderBefore.codeholderType;
		
		const updateData = {};
		let addressUpdateData = null;

		// Ensure that no field belonging to a different codeholder type is used
		for (let field of fields) {
			if (exclusiveFields.all.includes(field) && !exclusiveFields[codeholderType].includes(field)) {
				return res.status(400).type('text/plain')
					.send(`The field ${field} cannot be used on codeholders of type ${codeholderType}`);
			}

			if (field === 'address') {
				addressUpdateData = {...req.body.address};
				addressUpdateData.codeholderId = req.params.codeholderId;
				addressUpdateData.search = '';
				// TODO: Latin, remaining fields
			} else {
				updateData[field] = req.body[field];
			}
		}

		let oldDataFields = Object.keys(updateData);
		let oldData = null;
		let oldAddress = null;

		const trx = await createTransaction();
		oldData = await trx('codeholders')
			.leftJoin('codeholders_human', 'codeholders.id', 'codeholders_human.codeholderId')
			.leftJoin('codeholders_org', 'codeholders.id', 'codeholders_org.codeholderId')
			.where('id', req.params.codeholderId)
			.first(oldDataFields);

		await trx('codeholders')
			.leftJoin('codeholders_human', 'codeholders.id', 'codeholders_human.codeholderId')
			.leftJoin('codeholders_org', 'codeholders.id', 'codeholders_org.codeholderId')
			.where('id', req.params.codeholderId)
			.update(updateData);

		if (addressUpdateData) {
			oldAddress = await trx('codeholders_address')
				.where('codeholderId', req.params.codeholderId)
				.first('*') || {};

			await insertAsReplace(trx('codeholders_address').insert(addressUpdateData), trx);
		}

		// Ensure we can still see the codeholder through the member filter
		const foundCodeholder = await findCodeholderQuery.transacting(trx);

		if (!foundCodeholder) {
			res.status(400).type('text/plain').send('Codeholder would violate member filter after update');
			await rollbackTransaction(trx);
			return;
		}

		await trx.commit();

		res.sendStatus(204);

		// Handle history
		const histPromises = [];
		for (let field of Object.keys(req.body)) {
			let histEntry = {
				codeholderId: req.params.codeholderId,
				modTime: moment().unix(),
				modBy: req.user.modBy,
				modCmt: req.query.modCmt
			};
			if (field === 'address') {
				histEntry = {...histEntry, ...oldAddress};
			} else {
				histEntry[field] = oldData[field];
			}

			const table = 'codeholders_hist_' + field;
			const histQuery = AKSO.db(table).insert(histEntry);
			histPromises.push(histQuery);
		}
		await Promise.all(histPromises);
	}
};
