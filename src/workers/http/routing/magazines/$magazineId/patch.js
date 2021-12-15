import { subscribersSchema, setDefaultsSubscribers, verifySubscribers } from '../schema';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 50,
					pattern: '^[^\\n]+$'
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 5000,
					nullable: true
				},
				issn: {
					type: 'string',
					pattern: '^\\d{8}$',
					nullable: true
				},
				subscribers: subscribersSchema
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

		const data = { ...req.body };
		if ('subscribers' in data) {
			setDefaultsSubscribers(data.subscribers);
			verifySubscribers(data.subscribers);
		}
		data.subscribers = JSON.stringify(data.subscribers);

		await AKSO.db('magazines')
			.where('id', req.params.magazineId)
			.update(data);

		res.sendStatus(204);
	}
};
