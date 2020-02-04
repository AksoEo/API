export default {
	schema: {
		query: null,
		body: null,
		requirePerms: 'clients.delete'
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('clients')
			.where('apiKey', req.params.apiKey)
			.delete();

		if (deleted) { res.sendStatus(204); }
		else { res.sendStatus(404); }
	}
};
