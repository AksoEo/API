export default {
	schema: {
		query: null,
		body: null,
		requirePerms: 'admin_groups.update'
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('admin_permissions_groups')
			.where({
				adminGroupId: req.params.adminGroupId,
				permission: req.params.permission
			})
			.delete();

		if (deleted) {
			res.sendStatus(204);
		} else {
			res.sendStatus(404);
		}
	}
};
