export default {
	schema: {
		query: null,
		body: null,
		requirePerms: 'admin_groups.delete'
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('admin_groups')
			.where('id', req.params.adminGroupId)
			.delete();

		if (deleted) { res.sendStatus(204); }
		else { res.sendStatus(404); }
	}
};
