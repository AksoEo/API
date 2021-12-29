import { subscribersSchema, setDefaultsSubscribers, verifySubscribers } from '../../../schema';

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
				},
				published: {
					type: 'boolean'
				},
				subscribers: {
					...subscribersSchema,
					nullable: true
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

		// Make sure the edition exists
		const editionExists = await AKSO.db('magazines_editions')
			.first(1)
			.where({
				id: req.params.editionId,
				magazineId: req.params.magazineId
			});
		if (!editionExists) { return res.sendStatus(404); }

		if ('id' in req.body) {
			// Make sure the new id isn't already taken
			const idExists = await AKSO.db('magazines_editions')
				.first(1)
				.where({
					id: req.body.id,
					magazineId: req.params.magazineId
				});
			if (idExists) { return res.sendStatus(409); }
		}

		const data = { ...req.body };
		if ('subscribers' in data) {
			setDefaultsSubscribers(data.subscribers);
			verifySubscribers(data.subscribers);
		}
		data.subscribers = JSON.stringify(data.subscribers);

		await AKSO.db('magazines_editions')
			.where({
				id: req.params.editionId,
				magazineId: req.params.magazineId
			})
			.update(data);

		res.sendStatus(204);
	}
};
