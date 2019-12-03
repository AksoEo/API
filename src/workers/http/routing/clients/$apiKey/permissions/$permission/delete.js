export default {
	schema: {
		query: null,
		body: null,
		requirePerms: [
			'clients.update',
			'clients.perms.update'
		]
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('admin_permissions_clients')
			.where({
				apiKey: Buffer.from(req.params.apiKey, 'hex'),
				permission: req.params.permission
			})
			.delete();

		res.sendStatus(deleted ? 204 : 404);
	}
};
