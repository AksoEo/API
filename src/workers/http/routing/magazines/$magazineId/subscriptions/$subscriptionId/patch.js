import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				year: {
					type: 'number',
					format: 'year'
				},
				internalNotes: {
					type: 'string',
					minLength: 1,
					maxLength: 2000,
					nullable: true
				},
				paperVersion: {
					type: 'boolean'
				}
			},
			minProperties: 1,
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		// Find the magazine
		const magazine = await AKSO.db('magazines')
			.where('id', req.params.magazineId)
			.first('org');
		if (!magazine) { return res.sendStatus(404); }

		// Find the codeholder
		const codeholderQuery = AKSO.db('view_codeholders')
			.whereRaw('id = (SELECT codeholderId FROM magazines_subscriptions WHERE magazines_subscriptions.id = ?)', req.params.subscriptionId)
			.first(1);
		memberFilter(codeholderSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		const orgPerm = 'magazines.subscriptions.update.' + magazine.org;
		if (!req.hasPermission(orgPerm)) {
			return res.type('text/plain').status(403)
				.send('Missing perm magazines.subscriptions.update.<org>');
		}

		const updated = await AKSO.db('magazines_subscriptions')
			.where('id', req.params.subscriptionId)
			.whereExists(function () {
				this.select(1)
					.from('magazines')
					.where('magazines.id', req.params.magazineId)
					.where('magazines.org', magazine.org);
			})
			.update(req.body);

		res.sendStatus(updated ? 204 : 404);
	}
};
