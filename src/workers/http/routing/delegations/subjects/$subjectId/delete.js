export default {
	schema: {
		query: null,
		body: null,
		requirePerms: 'delegations.subjects.delete.uea' // Currently only UEA
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('delegations_subjects')
			.where('id', req.params.subjectId)
			.delete();

		res.sendStatus(deleted ? 204 : 404);
	}
};
