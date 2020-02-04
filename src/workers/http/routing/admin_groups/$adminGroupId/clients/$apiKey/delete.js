export default {
	schema: {
		query: null,
		body: null,
		requirePerms: [
			'admin_groups.update',
			'clients.read'
		]
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('admin_groups_members_clients')
			.where({
				adminGroupId: req.params.adminGroupId,
				apiKey: req.params.apiKey
			})
			.delete();

		if (deleted) {
			res.sendStatus(204);
		} else {
			res.sendStatus(404);
		}
	}
};
