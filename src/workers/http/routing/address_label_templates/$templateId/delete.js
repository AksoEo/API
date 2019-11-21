export default {
	schema: {
		query: null,
		body: null,
		requirePerms: 'address_label_templates.delete'
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('addressLabelTemplates')
			.where('id', req.params.templateId)
			.delete();

		res.sendStatus(deleted ? 204 : 404);
	}
};
