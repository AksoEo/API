import path from 'path';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				idHuman: {
					type: 'string',
					minLength: 1,
					maxLength: 50,
					pattern: '^[^\\n]+$',
					nullable: true
				},
				date: {
					type: 'string',
					format: 'date'
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 5000,
					nullable: true
				},
				published: {
					type: 'boolean'
				}
			},
			required: [
				'date'
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

		const id = (await AKSO.db('magazines_editions').insert({
			...req.body,
			...{
				magazineId: req.params.magazineId
			}
		}))[0];

		res.set('Location', path.join(
			AKSO.conf.http.path,
			'magazines',
			req.params.magazineId,
			'editions',
			id.toString()
		));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
