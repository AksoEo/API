export default {
	schema: {
		query: null,
		body: null,
		requirePerms: 'queries.delete'
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('savedQueries')
			.where('id', req.params.id)
			.delete();

		if (deleted) { res.sendStatus(204); }
		else { res.sendStatus(404); }
	}
};
