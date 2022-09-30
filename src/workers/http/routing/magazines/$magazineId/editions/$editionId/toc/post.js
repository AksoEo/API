import path from 'path';

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
			required: [
				'page',
				'title'
			],
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

		const editionExists = await AKSO.db('magazines_editions')
			.first(1)
			.where({
				id: req.params.editionId,
				magazineId: req.params.magazineId
			});
		if (!editionExists) { return res.sendStatus(404); }

		const id = (await AKSO.db('magazines_editions_toc').insert({
			...req.body,
			...{
				magazineId: req.params.magazineId,
				editionId: req.params.editionId
			}
		}))[0];

		res.set('Location', path.join(
			AKSO.conf.http.path,
			'/magazines/',
			req.params.magazineId,
			'/editions/',
			req.params.editionId,
			'/toc/',
			id.toString()
		));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
