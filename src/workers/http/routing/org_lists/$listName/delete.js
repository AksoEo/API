export default {
	schema: {
		requirePerms: 'org_lists.delete'
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('orgLists')
			.where('name', req.params.listName)
			.delete();
		res.sendStatus(deleted ? 204 : 404);
	}
};
