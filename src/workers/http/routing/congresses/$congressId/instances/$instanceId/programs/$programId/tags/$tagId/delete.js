export default {
	schema: {},

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

		// Make sure the program and the tag exist
		const exists = (await Promise.all([
			AKSO.db('congresses_instances_programs')
				.first(1)
				.where({
					congressInstanceId: req.params.instanceId,
					id: req.params.programId
				}),

			AKSO.db('congresses_instances_programTags')
				.first(1)
				.where({
					congressInstanceId: req.params.instanceId,
					id: req.params.tagId
				})
		])).every(x => !!x);
		if (!exists) { return res.sendStatus(404); }

		const deleted = await AKSO.db('congresses_instances_programs_tags')
			.where({
				congressInstanceProgramId: req.params.programId,
				congressInstanceProgramTagId: req.params.tagId
			})
			.delete();

		res.sendStatus(deleted ? 204 : 404);
	}
};
