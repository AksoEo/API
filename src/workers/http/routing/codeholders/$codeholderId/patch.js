import moment from 'moment';
import AddressFormat from 'google-i18n-address';

import { createTransaction, rollbackTransaction, insertAsReplace } from '../../../../../util';
import { modQuerySchema } from '../../../lib/codeholder-utils';
import * as AKSONotif from '../../../../../notif';
import * as AKSOMail from '../../../../../mail';

import { schema as parSchema, memberFilter, memberFieldsManual } from '../schema';

const schema = {
	...parSchema,
	...{
		query: modQuerySchema,
		body: {
			type: 'object',
			properties: {
				// Codeholder
				newCode: {
					type: 'string',
					pattern: '^[a-z]{6}$'
				},
				address: {
					type: 'object',
					properties: {
						country: {
							type: 'string',
							pattern: '^[a-z]{2}$'
						},
						countryArea: {
							type: 'string',
							pattern: '^[^\\n]{1,50}$',
							nullable: true
						},
						city: {
							type: 'string',
							pattern: '^[^\\n]{1,50}$',
							nullable: true
						},
						cityArea: {
							type: 'string',
							pattern: '^[^\\n]{1,50}$',
							nullable: true
						},
						streetAddress: {
							type: 'string',
							minLength: 1,
							maxLength: 100,
							nullable: true
						},
						postalCode: {
							type: 'string',
							pattern: '^[^\\n]{1,20}$',
							nullable: true
						},
						sortingCode: {
							type: 'string',
							pattern: '^[^\\n]{1,20}$',
							nullable: true
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
					maxLength: 200,
					nullable: true
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
					format: 'tel',
					nullable: true
				},
				isDead: {
					type: 'boolean'
				},
				deathdate: {
					type: 'string',
					format: 'date',
					nullable: true
				},

				// HumanCodeholder
				firstName: {
					type: 'string',
					pattern: '^[^\\n]{1,50}$',
					nullable: true
				},
				firstNameLegal: {
					type: 'string',
					pattern: '^[^\\n]{1,50}$'
				},
				lastName: {
					type: 'string',
					pattern: '^[^\\n]{1,50}$',
					nullable: true
				},
				lastNameLegal: {
					type: 'string',
					pattern: '^[^\\n]{1,50}$',
					nullable: true
				},
				honorific: {
					type: 'string',
					pattern: '^[^\\n]{2,15}$',
					nullable: true
				},
				birthdate: {
					type: 'string',
					format: 'date',
					nullable: true
				},
				profession: {
					type: 'string',
					pattern: '^[^\\n]{1,50}$',
					nullable: true
				},
				landlinePhone: {
					type: 'string',
					format: 'tel',
					nullable: true
				},
				cellphone: {
					type: 'string',
					format: 'tel',
					nullable: true
				},

				// OrgCodeholder
				fullName: {
					type: 'string',
					pattern: '^[^\\n]{1,100}$'
				},
				fullNameLocal: {
					type: 'string',
					pattern: '^[^\\n]{1,100}$',
					nullable: true
				},
				careOf: {
					type: 'string',
					pattern: '^[^\\n]{1,100}$',
					nullable: true
				},
				nameAbbrev: {
					type: 'string',
					pattern: '^[^\\n]{1,12}$',
					nullable: true
				},
				website: {
					type: 'string',
					maxLength: 50,
					format: 'safe-uri',
					nullable: true
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
		'nameAbbrev',
		'website'
	]
};
exclusiveFields.all = Object.values(exclusiveFields).reduce((a, b) => a.concat(b));

export default {
	schema: schema,

	run: async function run (req, res) {
		// Member fields
		const fields = Object.keys(req.body);
		if (!memberFieldsManual(fields, req, res, 'w')) {
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

		// Ensure that no field belonging to a different codeholder type is used and perform additional field validation
		for (let field of fields) {
			if (exclusiveFields.all.includes(field) && !exclusiveFields[codeholderType].includes(field)) {
				return res.status(400).type('text/plain')
					.send(`The field ${field} cannot be used on codeholders of type ${codeholderType}`);
			}

			if (field === 'address') {
				// Make sure the country exists
				const addressCountry = await AKSO.db('countries')
					.where({ enabled: true, code: req.body.address.country })
					.first('name_eo');
				if (!addressCountry) {
					return res.status(400).type('text/plain').send('Unknown address.country');
				}

				const addressInput = {...req.body.address};
				addressInput.countryCode = req.body.address.country;
				delete addressInput.country;
				let addressNormalized;
				try {
					addressNormalized = AddressFormat.normalizeAddress(addressInput);
				} catch (e) {
					if (e instanceof AddressFormat.InvalidAddress) {
						return res.status(400).type('text/plain').send('Invalid address: ' + JSON.stringify(e.errors));
					}
					throw e;
				}
				const addressLatin = AddressFormat.latinizeAddress(addressNormalized);

				const addressSearch = [
					addressLatin.countryCode,
					addressCountry.name_eo,
					addressNormalized.countryArea,
					addressLatin.countryArea,
					addressLatin.city,
					addressLatin.cityArea,
					addressLatin.streetAddress,
					addressLatin.postalCode,
					addressLatin.sortingCode
				]
					.filter(val => val) // remove null/undefined
					.join(' ');

				addressUpdateData = {
					...addressNormalized,
					...{
						codeholderId: req.params.codeholderId,
						search: addressSearch
					}
				};
				for (let [key, val] of Object.entries(addressLatin)) {
					addressUpdateData[key + '_latin'] = val;
				}
				addressUpdateData.country = req.body.address.country;
				delete addressUpdateData.countryCode;
				delete addressUpdateData.countryCode_latin;
			} else {
				if (field === 'feeCountry') {
					// Make sure the country exists
					const feeCountryFound = await AKSO.db('countries')
						.where({ enabled: true, code: req.body.feeCountry })
						.first(1);
					if (!feeCountryFound) {
						return res.status(400).type('text/plain').send('Unknown feeCountry');
					}
				} else if (field === 'email' && req.body.email !== null) {
					// Make sure the email isn't taken
					const emailTaken = await AKSO.db('codeholders')
						.where('email', req.body.email)
						.first(1);
					if (emailTaken) {
						return res.status(400).type('text/plain').send('email taken');
					}
				} else if (field === 'newCode') {
					// Make sure the newCode isn't taken
					const newCodeTaken = await AKSO.db('codeholders')
						.where('newCode', req.body.newCode)
						.first(1);
					if (newCodeTaken) {
						return res.status(400).type('text/plain').send('newCode taken');
					}
				}

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

		if (Object.keys(updateData).length) {
			await trx('codeholders')
				.leftJoin('codeholders_human', 'codeholders.id', 'codeholders_human.codeholderId')
				.leftJoin('codeholders_org', 'codeholders.id', 'codeholders_org.codeholderId')
				.where('id', req.params.codeholderId)
				.update(updateData);
		}

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
				const oldAddressWithPrefixes = {};
				for (let key in oldAddress) {
					if (key === 'codeholderId') { continue; }
					oldAddressWithPrefixes['address_' + key] = oldAddress[key];
				}
				histEntry = {...histEntry, ...oldAddressWithPrefixes};
			} else {
				histEntry[field] = oldData[field];
			}

			const table = 'codeholders_hist_' + field;
			const histQuery = AKSO.db(table).insert(histEntry);
			histPromises.push(histQuery);

			if (field === 'email') {
				const view = {
					emailFrom: oldData.email || '-nenio-',
					emailTo: updateData.email || '-nenio-',
					note: req.query.modCmt
				};
				// Send to old
				if (oldData.email !== null) {
					const to = (await AKSOMail.getNamesAndEmails(req.params.codeholderId))[0];
					to.email = oldData.email;
					const personalization = {
						to: to,
						substitutions: {
							name: to.name
						}
					};
					histPromises.push(AKSOMail.renderSendEmail({
						org: 'akso',
						tmpl: 'email-changed-admin',
						view: view,
						personalizations: [ personalization ]
					}));
				}
				// Send to new
				histPromises.push(AKSONotif.sendNotification({
					codeholderIds: [ req.params.codeholderId ],
					org: 'akso',
					notif: 'email-changed-admin',
					category: 'account',
					view: view
				}));
			}
		}
		await Promise.all(histPromises);
	}
};