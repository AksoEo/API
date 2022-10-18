import moment from 'moment-timezone';

import latlonSchema from 'akso/workers/http/lib/latlon-schema';

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

		// Obtain existing data for data validation
		const data = await AKSO.db('congresses_instances')
			.first('dateFrom', 'dateTo')
			.where({
				congressId: req.params.congressId,
				id: req.params.instanceId
			});
		if (!data) { return res.sendStatus(404); }

		const dateFrom = req.body.dateFrom ?? data.dateFrom;
		const dateTo = req.body.dateTo ?? data.dateTo;
		if (
			(req.body.dateTo && moment(req.body.dateTo) < moment(dateFrom)) ||
			(req.body.dateFrom && moment(req.body.dateFrom) > moment(dateTo))
		) {
			return res.type('text/plain').status(400).send('dateTo must be greater than or equal to dateFrom');
		}

		if (req.body.locationCoords) {
			req.body.locationCoords = AKSO.db.raw('POINT(?, ?)', req.body.locationCoords);
		}

		await AKSO.db('congresses_instances')
			.where('id', req.params.instanceId)
			.update(req.body);

		res.sendStatus(204);
	}
};
