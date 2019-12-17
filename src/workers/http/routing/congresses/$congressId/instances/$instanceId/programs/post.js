import path from 'path';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				title: {
					type: 'string',
					minLength: 1,
					maxLength: 100,
					pattern: '^[^\\n]+$'
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 2000,
					nullable: true
				},
				owner: {
					type: 'string',
					minLength: 1,
					maxLength: 100,
					nullable: true
				},
				timeFrom: {
					type: 'integer',
					format: 'uint64'
				},
				timeTo: {
					type: 'integer',
					format: 'uint64'
				},
				location: {
					type: 'integer',
					format: 'uint32',
					nullable: true
				}
			},
			required: [
				'title',
				'timeFrom',
				'timeTo'
			],
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const orgData = await AKSO.db('congresses')
			.innerJoin('congresses_instances', 'congressId', 'congresses.id')
			.where({
				congressId: req.params.congressId,
				'congresses_instances.id': req.params.instanceId
			})
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('congress_instances.update.' + orgData.org)) { return res.sendStatus(403); }

		// Manual data validation
		if (req.body.timeTo < req.body.timeFrom) {
			return res.type('text/plain').status(400).send('timeTo must not be lower than timeFrom');
		}
		if ('location' in req.body) {
			const exists = await AKSO.db('congresses_instances_locations')
				.first(1)
				.where({
					congressInstanceId: req.params.instanceId,
					id: req.body.location
				});
			if (!exists) { return res.type('text/plain').status(400).send('Invalid location in body'); }
		}

		const data = {
			...req.body,
			...{
				congressInstanceId: req.params.instanceId
			}
		};

		const id = (await AKSO.db('congresses_instances_programs').insert(data))[0];

		res.set('Location', path.join(
			AKSO.conf.http.path,
			'congresses',
			req.params.congressId,
			'instances',
			req.params.instanceId,
			'programs',
			id.toString()
		));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
