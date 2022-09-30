export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				page: {
					type: 'number',
					format: 'uint32'
				},
				title: {
					type: 'string',
					minLength: 1,
					maxLength: 500,
					pattern: '^[^\\n]+$'
				},
				author: {
					type: 'string',
					minLength: 1,
					maxLength: 200,
					pattern: '^[^\\n]+$',
					nullable: true
				},
				recitationAuthor: {
					type: 'string',
					minLength: 1,
					maxLength: 100,
					pattern: '^[^\\n]+$',
					nullable: true
				},
				text: {
					type: 'string',
					minLength: 1,
					maxLength: 100000, // 100k
					nullable: true
				},
				highlighted: {
					type: 'boolean'
				}
			},
			minProperties: 1,
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		const magazine = await AKSO.db('magazines')
			.first('org')
			.where('id', req.params.magazineId);
		if (!magazine) { return res.sendStatus(404); }
		
		const orgPerm = 'magazines.update.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		const exists = await AKSO.db('magazines_editions_toc')
			.first(1)
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				id: req.params.tocEntryId
			});
		if (!exists) { return res.sendStatus(404); }

		await AKSO.db('magazines_editions_toc')
			.where('id', req.params.tocEntryId)
			.update(req.body);

		res.sendStatus(204);
	}
};
