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
					format: 'int64'
				},
				timeTo: {
					type: 'integer',
					format: 'int64'
				},
				location: {
					type: 'integer',
					format: 'uint32',
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
			.innerJoin('congresses_instances', 'congressId', 'congresses.id')
			.where({
				congressId: req.params.congressId,
				'congresses_instances.id': req.params.instanceId
			})
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('congress_instances.update.' + orgData.org)) { return res.sendStatus(403); }

		const data = await AKSO.db('congresses_instances_programs')
			.first('timeFrom')
			.where({
				congressInstanceId: req.params.instanceId,
				id: req.params.programId
			});
		if (!data) { return res.sendStatus(404); }

		// Manual data validation
		const timeFrom = req.body.timeFrom || data.timeFrom;
		if ('timeTo' in req.body && req.body.timeTo < timeFrom) {
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

		await AKSO.db('congresses_instances_programs')
			.where('id', req.params.programId)
			.update(req.body);

		res.sendStatus(204);
	}
};
