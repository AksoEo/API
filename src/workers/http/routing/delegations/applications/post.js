import moment from 'moment-timezone';
import fetch from 'node-fetch';
import path from 'path';

import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: null,
		body: {
			type: 'object',
			properties: {
				codeholderId: {
					type: 'integer',
					format: 'uint32'
				},
				org: {
					type: 'string',
					enum: [ 'uea' ]
				},
				applicantNotes: {
					type: 'string',
					nullable: true,
					minLength: 1,
					maxLength: 2000
				},
				internalNotes: {
					type: 'string',
					nullable: true,
					minLength: 1,
					maxLength: 5000
				},
				cities: {
					type: 'array',
					maxItems: 10,
					uniqueItems: true,
					items: {
						type: 'string',
						pattern: '^Q\\d+$'
					}
				},
				subjects: {
					type: 'array',
					maxItems: 50,
					uniqueItems: true,
					items: {
						type: 'integer',
						format: 'uint32'
					}
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
							pattern: '^https://www\\.pasportaservo\\.org/ejo/\\d+/?$',
							maxLength: 50
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
				'codeholderId',
				'org',
				'cities',
				'subjects',
				'hosting',
				'tos'
			],
			additionalProperties: false
		},
		requirePerms: [ 'codeholders.read', 'delegations.applications.create.uea' ] // Currently only UEA
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Make sure the codeholder exists and is visible through the member filter
		const codeholderExistsQuery = AKSO.db('view_codeholders')
			.where('id', req.body.codeholderId)
			.first(1);
		memberFilter(codeholderSchema, codeholderExistsQuery, req);
		if (!await codeholderExistsQuery) {
			return res.status(400).type('text/plain')
				.send('codeholderId does not exist or is not visible due to member filter');
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
				.where('org', req.body.org)
		).map(x => x.id);
		for (const subject of req.body.subjects) {
			if (!subjectsExist.includes(subject)) {
				return res.status(400).type('text/plain')
					.send(`subject ${subject} does not exist for ${req.body.org}`);
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

		const trx = await req.createTransaction();

		const id = (await trx('delegations_applications')
			.insert({
				codeholderId: req.body.codeholderId,
				org: req.body.org,
				subjects: JSON.stringify(req.body.subjects),
				hosting: req.body.hosting ? JSON.stringify(req.body.hosting) : null,
				applicantNotes: req.body.applicantNotes,
				internalNotes: req.body.internalNotes,
				time: moment().unix(),
				tos_docDelegatesUEA: req.body.tos.docDelegatesUEA,
				tos_paperAnnualBook: req.body.tos.paperAnnualBook,
				tos_docDataProtectionUEA: req.body.tos.docDataProtectionUEA,
				tos_docDelegatesDataProtectionUEA: req.body.tos.docDelegatesDataProtectionUEA
			}))[0];

		await trx('delegations_applications_cities')
			.insert(req.body.cities.map(x => {
				return { id, city: parseInt(x.substring(1), 10) };
			}));

		await trx.commit();

		res.set('Location', path.join(AKSO.conf.http.path, 'delegations/applications/', id.toString()));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
