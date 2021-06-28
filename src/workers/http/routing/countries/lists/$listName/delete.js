export default {
	schema: {
		requirePerms: 'countries.lists.delete'
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('countries_lists')
			.where('name', req.params.listName)
			.delete();
		res.sendStatus(deleted ? 204 : 404);
	}
};
