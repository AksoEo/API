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
		if (!req.hasPermission('congress_instances.participants.delete.' + orgData.org)) { return res.sendStatus(403); }

		const deleted = await AKSO.db('forms_data')
			.where('dataId', req.params.dataId)
			.delete();

		res.sendStatus(deleted ? 204 : 404);
	}
};
