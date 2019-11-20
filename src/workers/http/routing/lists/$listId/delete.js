export default {
	schema: {
		requirePerms: 'lists.delete'
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('lists')
			.where('id', req.params.listId)
			.delete();

		res.sendStatus(deleted ? 204 : 404);
	}
};
