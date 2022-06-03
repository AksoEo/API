import moment from 'moment-timezone';
import fetch from 'node-fetch';

import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';
import { insertAsReplace } from 'akso/util';

import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: null,
		body: {
			type: 'object',
			properties: {
				cities: {
					type: 'array',
					items: {
						type: 'string',
						pattern: '^Q\\d+$'
					},
					maxItems: 10,
					uniqueItems: true,
					default: [],
				},
				countries: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							country: {
								type: 'string',
								minLength: 2,
								maxLength: 2
							},
							level: {
								type: 'integer',
								minimum: 0,
								maximum: 1
							}
						},
						required: [
							'country', 'level'
						],
						additionalProperties: false
					},
					maxItems: 10,
					default: [],
				},
				subjects: {
					type: 'array',
					items: {
						type: 'integer',
						format: 'uint32'
					},
					maxItems: 50,
					uniqueItems: true,
					default: [],
				},
				hosting: {
					type: 'object',
					nullable: true,
					properties: {
						maxDays: {
							type: 'integer',
							format: 'uint8',
							nullable: true
						},
						maxPersons: {
							type: 'integer',
							format: 'uint8',
							nullable: true
						},
						description: {
							type: 'string',
							nullable: true,
							minLength: 1,
							maxLength: 400
						},
						psProfileURL: {
							type: 'string',
							format: 'safe-uri',
							nullable: true,
							maxLength: 50,
							pattern: '^https://www\\.pasportaservo\\.org/ejo/\\d+/?$'
						}
					},
					additionalProperties: false
				},
				tos: {
					type: 'object',
					properties: {
						docDataProtectionUEA: {
							type: 'boolean',
							const: true
						},
						docDataProtectionUEATime: {
							type: 'integer',
							format: 'uint64'
						},
						docDelegatesUEA: {
							type: 'boolean',
							const: true
						},
						docDelegatesUEATime: {
							type: 'integer',
							format: 'uint64'
						},
						docDelegatesDataProtectionUEA: {
							type: 'boolean',
							const: true
						},
						docDelegatesDataProtectionUEATime: {
							type: 'integer',
							format: 'uint64'
						},
						paperAnnualBook: {
							type: 'boolean'
						},
						paperAnnualBookTime: {
							type: 'integer',
							format: 'uint64'
						}
					},
					required: [
						'docDataProtectionUEA',
						'docDelegatesUEA',
						'docDelegatesDataProtectionUEA',
						'paperAnnualBook'
					],
					additionalProperties: false
				}
			},
			required: [
				'tos'
			],
			additionalProperties: false
		},
		requirePerms: [ 'codeholders.read', 'codeholders.delegations.update.uea' ] // Currently only UEA
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(codeholderSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		if (req.params.org !== 'uea') {
			return res.status(400).type('text/plain')
				.send('Invalid org');
		}

		// Prevent duplicate countries
		const countryCodes = req.body.countries.map(x => x.country);
		const dedupedCountryCodes = [...new Set(countryCodes)];
		if (dedupedCountryCodes.length !== countryCodes.length) {
			return res.status(400).type('text/plain')
				.send('countries contains duplicate countries.country');
		}

		// Verify the existence of countries
		const countriesExist = (
			await AKSO.db('countries')
				.select('code')
				.whereIn('code', countryCodes)
				.whereRaw('enabled')
		).map(x => x.code);
		for (const country of countriesExist) {
			if (!countriesExist.includes(country)) {
				return res.status(400).type('text/plain')
					.send(`country ${country} does not exist or is not enabled`);
			}
		}

		// Obtain the current country delegations
		const countryDelegations = await AKSO.db('codeholders_delegations_countries')
			.select('country', 'level')
			.where({
				codeholderId: req.params.codeholderId,
				org: req.params.org
			});
		const countryDelegationsIndexObj = {};
		// Make sure no country delegations are being removed where not allowed
		for (const countryDelegation of countryDelegations) {
			countryDelegationsIndexObj[countryDelegation.country] = countryDelegation;

			const perm = `codeholders.delegations.update_country_delegates.${req.params.org}.${countryDelegation.country}`;
			if (!req.hasPermission(perm)) {
				// We may not modify this entry, so make sure it's still there
				let found = false;
				for (const countryObj of req.body.countries) {
					if (countryObj.country === countryDelegation.country && countryObj.level === countryDelegation.level) {
						found = true;
						break;
					}
				}
				if (!found) {
					return res.status(400).type('text/plain')
						.send(`Permission ${perm} missing, thus the country delegation for ${countryDelegation.country}:${countryDelegation.level} may not be removed`);
				}
			}
		}
		// Make sure none are being added where not allowed
		for (const countryObj of req.body.countries) {
			// Was it already there?
			if (
				countryObj.country in countryDelegationsIndexObj
				&& countryDelegationsIndexObj[countryObj.country].level === countryObj.level
			) { continue; }
			// It is new, may we have add it?
			const perm = `codeholders.delegations.update_country_delegates.${req.params.org}.${countryObj.country}`;
			if (!req.hasPermission(perm)) {
				return res.status(400).type('text/plain')
					.send(`Permission ${perm} missing, thus a new country delegation for ${countryObj.country} may not be added`);
			}
		}

		// Verify the existence of cities
		const cities = req.body.cities.map(x => parseInt(x.substring(1), 10));
		const citiesExist = (
			await AKSO.geodb('cities')
				.select('id')
				.whereIn('id', cities)
		).map(x => x.id);
		for (const city of cities) {
			if (!citiesExist.includes(city)) {
				return res.status(400).type('text/plain')
					.send(`city Q${city} does not exist`);
			}
		}

		// Verify the existence of subjects
		const subjectsExist = (
			await AKSO.db('delegations_subjects')
				.select('id')
				.whereIn('id', req.body.subjects)
				.where('org', req.params.org)
		).map(x => x.id);
		for (const subject of req.body.subjects) {
			if (!subjectsExist.includes(subject)) {
				return res.status(400).type('text/plain')
					.send(`subject ${subject} does not exist for ${req.params.org}`);
			}
		}

		// Verify hosting.psProfileURL if present
		if (req.body.hosting && req.body.hosting.psProfileURL) {
			const psRes = await fetch(req.body.hosting.psProfileURL, {
				method: 'head'
			});
			if (!psRes.ok) {
				return res.status(400).type('text/plain')
					.send('Invalid hosting.psProfileURL');
			}
		}

		const baseObj = {
			codeholderId: req.params.codeholderId,
			org: req.params.org
		};

		const trx = await req.createTransaction();

		await insertAsReplace(
			trx('codeholders_delegations')
				.insert({
					...baseObj,
					approvedBy: req.user.modBy,
					approvedTime: moment().unix(),
					tos_docDataProtectionUEA: req.body.tos.docDataProtectionUEA,
					tos_docDataProtectionUEA_time: req.body.tos.docDataProtectionUEATime || moment().unix(),
					tos_docDelegatesUEA: req.body.tos.docDelegatesUEA,
					tos_docDelegatesUEA_time: req.body.tos.docDelegatesUEATime || moment().unix(),
					tos_docDelegatesDataProtectionUEA: req.body.tos.docDelegatesDataProtectionUEA,
					tos_docDelegatesDataProtectionUEA_time: req.body.tos.docDelegatesDataProtectionUEATime || moment().unix(),
					tos_paperAnnualBook: req.body.tos.paperAnnualBook,
					tos_paperAnnualBook_time: req.body.tos.paperAnnualBookTime || moment().unix()
				})
		);

		// REPLACE auto-removes all foreign keys, so we can just insert into the rest
		const promises = [];
		
		if (cities.length) {
			promises.push(
				trx('codeholders_delegations_cities')
					.insert(cities.map(cityId => {
						return {
							...baseObj,
							city: cityId
						};
					}))
			);
		}

		if (req.body.countries.length) {
			promises.push(
				trx('codeholders_delegations_countries')
					.insert(req.body.countries.map(obj => {
						return {
							...baseObj,
							...obj
						};
					}))
			);
		}

		if (req.body.subjects.length) {
			promises.push(
				trx('codeholders_delegations_subjects')
					.insert(req.body.subjects.map(subjectId => {
						return {
							...baseObj,
							subjectId
						};
					}))
			);
		}

		if (req.body.hosting) {
			promises.push(
				trx('codeholders_delegations_hosting')
					.insert({
						...baseObj,
						...req.body.hosting
					})
			);
		}

		await Promise.all(promises);
		await trx.commit();

		res.sendStatus(204);
	}
};
