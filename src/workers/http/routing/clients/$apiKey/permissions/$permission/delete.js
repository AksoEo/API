export default {
	schema: {
		query: null,
		body: null,
		requirePerms: [
			'clients.read',
			'clients.perms.update'
		]
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('admin_permissions_clients')
			.where({
				apiKey: req.params.apiKey,
				permission: req.params.permission
			})
			.delete();

		res.sendStatus(deleted ? 204 : 404);
	}
};
