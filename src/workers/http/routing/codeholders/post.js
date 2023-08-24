import path from 'path';
import * as AddressFormat from '@cpsdqs/google-i18n-address';
import moment from 'moment-timezone';
import { bannedCodes } from '@tejo/akso-client';

import { rollbackTransaction } from 'akso/util';
import { schema as parSchema, memberFilter, memberFieldsManual } from './schema';

const codeholderRequiredProps = [ 'newCode', 'codeholderType' ];

const schema = {
	...parSchema,
	...{
		query: null,
		body: {
			definitions: {
				Codeholder: {
					type: 'object',
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
							required: [ 'country' ],
							additionalProperties: false
						},
						addressPublicity: {
							type: 'string',
							enum: [ 'private', 'public', 'members' ]
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
						emailPublicity: {
							type: 'string',
							enum: [ 'private', 'public', 'members' ]
						},
						enabled: {
							type: 'boolean'
						},
						notes: {
							type: 'string',
							minLength: 1,
							maxLength: 10000,
							nullable: true
						},
						officePhone: {
							type: 'string',
							format: 'tel'
						},
						officePhonePublicity: {
							type: 'string',
							enum: [ 'private', 'public', 'members' ]
						},
						profilePicturePublicity: {
							type: 'string',
							enum: [ 'public', 'members' ]
						},
						website: {
							type: 'string',
							format: 'safe-uri',
							maxLength: 50,
							nullable: true
						},
						biography: {
							type: 'string',
							minLength: 1,
							maxLength: 2000,
							nullable: true
						}
					}
				}
			},

			oneOf: [
				{ // HumanCodeholder
					$merge: {
						source: { $ref: '#/definitions/Codeholder' },
						with: {
							type: 'object',
							properties: {
								newCode: {
									pattern: '^(?!xx)[a-z]{6}$'
								},
								codeholderType: {
									const: 'human'
								},
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
								lastNamePublicity: {
									type: 'string',
									enum: [ 'private', 'public', 'members' ]
								},
								honorific: {
									type: 'string',
									pattern: '^[^\\n]{2,25}$',
									nullable: true
								},
								birthdate: {
									type: 'string',
									format: 'date',
									validateFunction: val => !(moment(val).isAfter(moment()))
								},
								profession: {
									type: 'string',
									pattern: '^[^\\n]{1,50}$'
								},
								landlinePhone: {
									type: 'string',
									format: 'tel'
								},
								landlinePhonePublicity: {
									type: 'string',
									enum: [ 'private', 'public', 'members' ]
								},
								cellphone: {
									type: 'string',
									format: 'tel'
								},
								cellphonePublicity: {
									type: 'string',
									enum: [ 'private', 'public', 'members' ]
								},
							},
							required: codeholderRequiredProps.concat([ 'firstNameLegal' ]),
							additionalProperties: false
						}
					}
				},
				{ // OrgCodeholder
					$merge: {
						source: { $ref: '#/definitions/Codeholder' },
						with: {
							type: 'object',
							properties: {
								newCode: {
									pattern: '^xx[a-z]{4}$'
								},
								codeholderType: {
									const: 'org'
								},
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
							required: codeholderRequiredProps.concat([ 'fullName' ]),
							additionalProperties: false
						}
					}
				}
			]
		},
		requirePerms: 'codeholders.create'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Member fields
		const fields = Object.keys(req.body);
		if (!memberFieldsManual(fields, req, 'w')) {
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

		let addressCountry;
		if (req.body.address) {
			addressCountry = await AKSO.db('countries')
				.where({ enabled: true, code: req.body.address.country })
				.first('name_eo');
			if (!addressCountry) {
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

		// Check if newCode is banned
		for (const bannedCode of bannedCodes) {
			if (req.body.newCode.includes(bannedCode)) {
				return res.status(400).type('text/plain').send('newCode is banned');
			}
		}

		if (req.body.email) {
			// Check if email is taken
			const emailTaken = await AKSO.db('codeholders')
				.where('email', req.body.email)
				.first(1);
			if (emailTaken) {
				return res.status(400).type('text/plain').send('email is taken');
			}
		}

		// Generate the member filter lookup before beginning the transaction to reduce latency
		const findNewCodeholderQuery = AKSO.db('view_codeholders');
		memberFilter(schema, findNewCodeholderQuery, req);

		const trx = await req.createTransaction();
		const id = (await trx('codeholders')
			.insert({
				codeholderType: req.body.codeholderType,
				creationTime: moment().unix(),
				newCode: req.body.newCode,
				addressPublicity: req.body.addressPublicity,
				email: req.body.email,
				emailPublicity: req.body.emailPublicity,
				enabled: req.body.enabled,
				feeCountry: req.body.feeCountry,
				notes: req.body.notes,
				officePhone: req.body.officePhone,
				officePhonePublicity: req.body.officePhonePublicity,
				profilePicturePublicity: req.body.profilePicturePublicity,
				website: req.body.website,
				biography: req.body.biography
			}))[0];

		if (req.body.codeholderType === 'human') {
			await trx('codeholders_human').insert({
				codeholderId: id,
				firstName: req.body.firstName,
				firstNameLegal: req.body.firstNameLegal,
				lastName: req.body.lastName,
				lastNameLegal: req.body.lastNameLegal,
				lastNamePublicity: req.body.lastNamePublicity,
				honorific: req.body.honorific,
				birthdate: req.body.birthdate,
				profession: req.body.profession,
				landlinePhone: req.body.landlinePhone,
				landlinePhonePublicity: req.body.landlinePhonePublicity,
				cellphone: req.body.cellphone,
				cellphonePublicity: req.body.cellphonePublicity
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
			const addressInput = {...req.body.address};
			addressInput.countryCode = req.body.address.country;
			delete addressInput.country;
			let addressNormalized;
			try {
				addressNormalized = await AddressFormat.normalizeAddress(addressInput);
			} catch (e) {
				await rollbackTransaction(trx);
				if (e instanceof AddressFormat.InvalidAddress) {
					return res.status(400).type('text/plain')
						.send('Invalid address: ' + JSON.stringify(e.errors));
				}
				throw e;
			}
			const addressLatin = await AddressFormat.latinizeAddress(addressNormalized);

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

			await trx('codeholders_address').insert({
				codeholderId: id,
				country: req.body.address.country,
				countryArea: addressNormalized.countryArea,
				countryArea_latin: addressLatin.countryArea,
				city: addressNormalized.city,
				city_latin: addressLatin.city,
				cityArea: addressNormalized.cityArea,
				cityArea_latin: addressLatin.cityArea,
				streetAddress: addressNormalized.streetAddress,
				streetAddress_latin: addressLatin.streetAddress,
				postalCode: addressNormalized.postalCode,
				postalCode_latin: addressLatin.postalCode,
				sortingCode: addressNormalized.sortingCode,
				sortingCode_latin: addressLatin.sortingCode,
				search: addressSearch
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
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
