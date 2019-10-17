export default {
	schema: {
		query: null,
		body: null,
		requirePerms: 'admin_groups.update'
	},

	run: async function run (req, res) {
		// Make sure the admin group exists
		const exists = await AKSO.db('admin_groups')
			.where('id', req.params.adminGroupId)
			.first(1);
		if (!exists) {
			return res.sendStatus(404);
		}

		const data = {
			adminGroupId: req.params.adminGroupId,
			permission: req.params.permission
		};

		// Check if the entry already exists
		const alreadyInserted = await AKSO.db('admin_permissions_groups')
			.first(1)
			.where(data);

		if (!alreadyInserted) {
			await AKSO.db('admin_permissions_groups')
				.insert(data);
		}

		res.sendStatus(204);
	}
};
