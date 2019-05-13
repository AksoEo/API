import path from 'path';

import { createTransaction, rollbackTransaction } from '../../util';
import { schema as parSchema, memberFilter, memberFieldsManual } from './schema';

const schema = {
	...parSchema,
	...{
		query: null,
		body: {
			definitions: {
				Codeholder: {
					properties: {
						newCode: {
							type: 'string',
							pattern: '^[a-z]{6}$'
						},
						codeholderType: {
							type: 'string',
							enum: [ 'human', 'org' ]
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
							required: [ 'country' ],
							additionalProperties: false
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
						}
					},
					required: [ 'newCode', 'codeholderType' ],
					additionalProperties: false
				}
			},

			if: {
				properties: {
					codeholderType: {
						enum: [ 'human' ]
					}
				}
			},
			then: {
				$merge: {
					source: { $ref: '#/definitions/Codeholder' },
					with: { // HumanCodeholder
						properties: {
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
							}
						},
						required: [ 'firstNameLegal' ]
					}
				}
			},
			else: {
				$merge: {
					source: { $ref: '#/definitions/Codeholder' },
					with: { // OrgCodeholder
						properties: {
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
						required: [ 'fullName' ]
					}
				}
			}
		},
		requirePerms: 'codeholders.create'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Member fields
		const fields = Object.keys(req.body);
		if (!memberFieldsManual(fields, req, res, 'r')) {
			return res.status(403).type('text/plain').send('Illegal codeholder fields used, check /perms');
		}

		// newCode must begin with xx for orgs, and with anything but xx for humans
		const isOrg = req.body.codeholderType === 'org';
		const hasOrgCode = req.body.newCode.substring(0, 2) === 'xx';
		if (isOrg !== hasOrgCode) {
			return res.status(400).type('text/plain').send('Org UEA codes must begin with xx. Human codes with anything but xx.');
		}

		if (req.body.feeCountry) {
			const feeCountryFound = await AKSO.db('countries')
				.where({ enabled: true, code: req.body.feeCountry })
				.first(1);
			if (!feeCountryFound) {
				return res.status(400).type('text/plain').send('Unknown feeCountry');
			}
		}

		if (req.body.address) {
			const addressCountryFound = await AKSO.db('countries')
				.where({ enabled: true, code: req.body.address.country })
				.first(1);
			if (!addressCountryFound) {
				return res.status(400).type('text/plain').send('Unknown address.country');
			}

			if (!req.body.feeCountry) {
				req.body.feeCountry = req.body.address.country;
			}
		}

		// Check if newCode is taken
		const newCodeTaken = await AKSO.db('codeholders')
			.where('newCode', req.body.newCode)
			.first(1);
		if (newCodeTaken) {
			return res.status(400).type('text/plain').send('newCode is taken');
		}


		// Generate the member filter lookup before beginning the transaction to reduce latency
		const findNewCodeholderQuery = AKSO.db('view_codeholders');
		memberFilter(schema, findNewCodeholderQuery, req);

		const trx = await createTransaction();
		const id = (await trx('codeholders')
			.insert({
				codeholderType: req.body.codeholderType,
				newCode: req.body.newCode,
				email: req.body.email,
				enabled: req.body.enabled,
				feeCountry: req.body.feeCountry,
				notes: req.body.notes,
				officePhone: req.body.officePhone
			}))[0];

		if (req.body.codeholderType === 'human') {
			await trx('codeholders_human').insert({
				codeholderId: id,
				firstName: req.body.firstName,
				firstNameLegal: req.body.firstNameLegal,
				lastName: req.body.lastName,
				lastNameLegal: req.body.lastNameLegal,
				honorific: req.body.honorific,
				birthdate: req.body.birthdate,
				profession: req.body.profession,
				landlinePhone: req.body.landlinePhone,
				cellphone: req.body.cellphone
			});
		} else if (req.body.codeholderType === 'org') {
			await trx('codeholders_org').insert({
				codeholderId: id,
				fullName: req.body.fullName,
				fullNameLocal: req.body.fullNameLocal,
				careOf: req.body.careOf,
				nameAbbrev: req.body.nameAbbrev
			});
		}

		if (req.body.address) {
			await trx('codeholders_address').insert({
				codeholderId: id,
				country: req.body.address.country,
				countryArea: req.body.address.countryArea,
				countryArea_latin: null, // todo
				city: req.body.address.city,
				city_latin: null, // todo
				cityArea: req.body.address.cityArea,
				cityArea_latin: null, // todo
				streetAddress: req.body.address.streetAddress,
				streetAddress_latin: null, // todo
				postalCode: req.body.address.postalCode,
				postalCode_latin: null, // todo
				sortingCode: req.body.address.sortingCode,
				sortingCode_latin: null, // todo
				search: '' // todo
			});
		}

		// Check if we can see the codeholder through the memberfilter
		const foundNewCodeholder = await findNewCodeholderQuery
			.transacting(trx)
			.where('id', id);

		if (!foundNewCodeholder) {
			res.status(400).type('text/plain').send('New codeholder violates member filter');
			await rollbackTransaction(trx);
			return;
		}

		await trx.commit();
		res.set('Location', path.join(AKSO.conf.http.path, 'codeholders', id.toString()));
		res.sendStatus(201);
	}
};
