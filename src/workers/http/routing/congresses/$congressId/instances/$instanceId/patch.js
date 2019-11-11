import latlonSchema from '../../../../../lib/latlon-schema';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 100,
					pattern: '^[^\\n]+$'
				},
				humanId: {
					type: 'string',
					minLength: 1,
					maxLength: 20,
					pattern: '^[^\\n]+$'
				},
				dateFrom: {
					type: 'string',
					format: 'date'
				},
				dateTo: {
					type: 'string',
					format: 'date'
				},
				locationName: {
					type: 'string',
					minLength: 1,
					maxLength: 100,
					pattern: '^[^\\n]+$',
					nullable: true
				},
				locationNameLocal: {
					type: 'string',
					minLength: 1,
					maxLength: 100,
					pattern: '^[^\\n]+$',
					nullable: true
				},
				locationCoords: {
					...latlonSchema,
					...{
						nullable: true
					}
				},
				locationAddress: {
					type: 'string',
					minLength: 1,
					maxLength: 500,
					nullable: true
				},
				tz: {
					type: 'string',
					format: 'tz',
					nullable: true
				}
			},
			minProperties: 1,
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const orgData = await AKSO.db('congresses')
			.where('id', req.params.congressId)
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('congress_instances.update.' + orgData.org)) { return res.sendStatus(403); }

		if (req.body.locationCoords) {
			req.body.locationCoords = AKSO.db.raw('POINT(?, ?)', req.body.locationCoords);
		}

		const updated = await AKSO.db('congresses_instances')
			.where({
				congressId: req.params.congressId,
				id: req.params.instanceId
			})
			.update(req.body);

		res.sendStatus(updated ? 204 : 404);
	}
};
