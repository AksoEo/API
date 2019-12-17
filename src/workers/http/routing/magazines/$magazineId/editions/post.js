import path from 'path';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				id: {
					type: 'number',
					format: 'uint32'
				},
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
				}
			},
			required: [
				'id',
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

		// Make sure the id isn't already taken
		const idExists = await AKSO.db('magazines_editions')
			.first(1)
			.where({
				id: req.body.id,
				magazineId: req.params.magazineId
			});
		if (idExists) { return res.sendStatus(409); }

		await AKSO.db('magazines_editions').insert({
			...req.body,
			...{
				magazineId: req.params.magazineId
			}
		});

		res.set('Location', path.join(
			AKSO.conf.http.path,
			'magazines',
			req.params.magazineId,
			'editions',
			req.body.id
		));
		res.set('X-Identifier', req.body.id);
		res.sendStatus(201);
	}
};
