import path from 'path';

import latlonSchema from 'akso/workers/http/lib/latlon-schema';
import { icons, parseOpenHours } from './schema';

const locationRequiredProps = [ 'type', 'name' ];

export default {
	schema: {
		query: null,
		body: {
			definitions: {
				Location: {
					type: 'object',
					properties: {
						type: {
							type: 'string',
							enum: [ 'internal', 'external' ]
						},
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
						}
					}
				}
			},

			oneOf: [
				{ // internal
					$merge: {
						source: { $ref: '#/definitions/Location' },
						with: {
							type: 'object',
							properties: {
								type: {
									const: 'internal'
								},
								externalLoc: {
									type: 'integer',
									format: 'uint32',
									nullable: true
								}
							},
							required: locationRequiredProps,
							additionalProperties: false
						}
					}
				},

				{ // external
					$merge: {
						source: { $ref: '#/definitions/Location' },
						with: {
							type: 'object',
							properties: {
								type: {
									const: 'external'
								},
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
							required: locationRequiredProps.concat([ 'll' ]),
							additionalProperties: false
						}
					}
				}
			]
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

		// Manual data validation
		if (req.body.rating && req.body.rating.rating > req.body.rating.max) {
			return res.type('text/plain').status(400).send('rating.rating must not exceed rating.max');
		}
		if ('externalLoc' in req.body) {
			const exists = await AKSO.db('congresses_instances_locations')
				.first(1)
				.where({
					congressInstanceId: req.params.instanceId,
					id: req.body.externalLoc,
					type: 'external'
				});	
			if (!exists) { return res.type('text/plain').status(400).send('Unknown externalLoc ' + req.body.externalLoc); }
		}

		const openHours = parseOpenHours(req.body.openHours, congressData.dateFrom, congressData.dateTo);

		const id = (await AKSO.db('congresses_instances_locations').insert({
			congressInstanceId: req.params.instanceId,
			type: req.body.type,
			name: req.body.name,
			description: req.body.description
		}))[0];

		if (req.body.type === 'external') {
			await AKSO.db('congresses_instances_locations_external').insert({
				congressInstanceLocationId: id,
				address: req.body.address,
				ll: AKSO.db.raw('POINT(?, ?)', req.body.ll),
				icon: req.body.icon || 'GENERIC'
			});

			if (req.body.rating) {
				await AKSO.db('congresses_instances_locations_external_rating').insert({
					congressInstanceLocationId: id,
					rating: req.body.rating.rating.toFixed(2),
					rating_max: req.body.rating.max,
					rating_type: req.body.rating.type
				});
			}
		} else if (req.body.type === 'internal') {
			await AKSO.db('congresses_instances_locations_internal').insert({
				congressInstanceLocationId: id,
				externalLoc: req.body.externalLoc
			});
		}

		if (openHours) {
			await AKSO.db('congresses_instances_locations_openHours').insert(
				openHours.map(x => {
					return {
						congressInstanceLocationId: id,
						...x
					};
				})
			);
		}

		res.set('Location', path.join(
			AKSO.conf.http.path,
			'congresses',
			req.params.congressId,
			'instances',
			req.params.instanceId,
			'locations',
			id.toString()
		));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
