export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 200,
					pattern: '^[^\\n]+$'
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 2000,
					nullable: true
				}
			},
			additionalProperties: false,
			minProperties: 1
		},
		requirePerms: 'delegations.subjects.update.uea' // Currently only UEA
	},

	run: async function run (req, res) {
		const updated = await AKSO.db('delegations_subjects')
			.where('id', req.params.subjectId)
			.update(req.body);

		res.sendStatus(updated ? 204 : 404);
	}
};
