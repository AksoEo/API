import latlonSchema from 'akso/workers/http/lib/latlon-schema';
import { insertAsReplace } from 'akso/util';
import { icons, parseOpenHours } from '../schema';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 50,
					pattern: '^[^\\n]+$'
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 200,
					nullable: true
				},
				openHours: {
					type: 'object',
					nullable: true
				},

				// internal
				externalLoc: {
					type: 'integer',
					format: 'uint32',
					nullable: true
				},

				// external
				address: {
					type: 'string',
					minLength: 1,
					maxLength: 500,
					nullable: true
				},
				ll: latlonSchema,
				rating: {
					type: 'object',
					nullable: true,
					properties: {
						rating: {
							type: 'number',
							minimum: 0
						},
						max: {
							type: 'integer',
							minimum: 1,
							maximum: 10
						},
						type: {
							type: 'string',
							enum: [ 'stars', 'hearts' ]
						}
					},
					required: [
						'rating', 'max', 'type'
					],
					additionalProperties: false
				},
				icon: {
					type: 'string',
					enum: icons
				}

			},
			minProperties: 1,
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const congressData = await AKSO.db('congresses')
			.innerJoin('congresses_instances', 'congressId', 'congresses.id')
			.where({
				congressId: req.params.congressId,
				'congresses_instances.id': req.params.instanceId
			})
			.first('org', 'dateFrom', 'dateTo');
		if (!congressData) { return res.sendStatus(404); }
		if (!req.hasPermission('congress_instances.update.' + congressData.org)) { return res.sendStatus(403); }

		const locData = await AKSO.db('congresses_instances_locations')
			.first('type')
			.where({
				congressInstanceId: req.params.instanceId,
				id: req.params.locationId
			});
		if (!locData) { return res.sendStatus(404); }

		// Manual data validation
		if (locData.type === 'external') {
			if ('externalLoc' in req.body) {
				return res.type('text/plain').status(400).send('externalLoc is only allowed for internal locations');
			}
		} else if (locData.type === 'internal') {
			if ('address' in req.body) {
				return res.type('text/plain').status(400).send('address is only allowed for external locations');
			}
			if ('ll' in req.body) {
				return res.type('text/plain').status(400).send('ll is only allowed for external locations');
			}
			if ('rating' in req.body) {
				return res.type('text/plain').status(400).send('rating is only allowed for external locations');
			}
			if ('icon' in req.body) {
				return res.type('text/plain').status(400).send('icon is only allowed for external locations');
			}
		}

		if (req.body.rating && req.body.rating.rating > req.body.rating.max) {
			return res.type('text/plain').status(400).send('rating.rating must not exceed rating.max');
		}

		if (req.body.externalLoc) {
			const exists = await AKSO.db('congresses_instances_locations')
				.first(1)
				.where({
					congressInstanceId: req.params.instanceId,
					id: req.body.externalLoc,
					type: 'external'
				});	
			if (!exists) { return res.type('text/plain').status(400).send('Unknown externalLoc ' + req.body.externalLoc); }
		}

		let openHours;
		if ('openHours' in req.body) {
			openHours = parseOpenHours(req.body.openHours, congressData.dateFrom, congressData.dateTo);
		}

		const mainData = {};
		if ('name' in req.body) { mainData.name = req.body.name; }
		if ('description' in req.body) { mainData.description = req.body.description; }

		const trx = await req.createTransaction();

		if (Object.keys(mainData).length) {
			await trx('congresses_instances_locations')
				.where('id', req.params.locationId)
				.update(mainData);
		}

		const externalData = {};
		if ('address' in req.body) { externalData.address = req.body.address; }
		if ('ll' in req.body) { externalData.ll = AKSO.db.raw('POINT(?, ?)', req.body.ll); }
		if ('icon' in req.body) { externalData.icon = req.body.icon; }

		if (Object.keys(externalData).length) {
			await trx('congresses_instances_locations_external')
				.where('congressInstanceLocationId', req.params.locationId)
				.update(externalData);
		}

		if ('externalLoc' in req.body) {
			await trx('congresses_instances_locations_internal')
				.where('congressInstanceLocationId', req.params.locationId)
				.update('externalLoc', req.body.externalLoc);
		}

		if ('rating' in req.body) {
			if (req.body.rating === null) {
				await trx('congresses_instances_locations_external_rating')
					.where('congressInstanceLocationId', req.params.locationId)
					.delete();
			} else {
				await insertAsReplace(trx('congresses_instances_locations_external_rating')
					.insert({
						congressInstanceLocationId: req.params.locationId,
						rating: req.body.rating.rating.toFixed(2),
						rating_max: req.body.rating.max,
						rating_type: req.body.rating.type
					}), trx);
			}
		}

		if ('openHours' in req.body) {
			await trx('congresses_instances_locations_openHours')
				.where('congressInstanceLocationId', req.params.locationId)
				.delete();

			if (openHours !== null) {
				await trx('congresses_instances_locations_openHours')
					.insert(openHours.map(x => {
						return {
							congressInstanceLocationId: req.params.locationId,
							...x
						};
					}));
			}
		}

		await trx.commit();

		res.sendStatus(204);
	}
};
