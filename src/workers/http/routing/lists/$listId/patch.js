import QueryUtil from 'akso/lib/query-util';

import { schema as codeholderSchema } from 'akso/workers/http/routing/codeholders/schema';

const schema = {
	...codeholderSchema,
	...{
		maxQueryLimit: 100
	}
};

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 150,
					pattern: '^[^\n]+$'
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 2000,
					nullable: true
				},
				filters: {
					type: 'array',
					minItems: 1,
					maxItems: 50,
					items: {
						type: 'string',
						maxBytes: 4000
					}
				}
			},
			additionalProperties: false,
			minProperties: 1
		},
		requirePerms: [
			'lists.update',
			'codeholders.read'
		]
	},

	run: async function run (req, res) {
		// Manual data validation
		if (req.body.filters) {
			for (const filter of req.body.filters) {
				let json = null;
				try {
					json = JSON.parse(filter);
				} catch (e) {
					return res.type('text/plain').status(400).send('filters must contain valid JSON');
				}

				try {
					let fieldWhitelist = null;
					if (req.memberFields) { fieldWhitelist = Object.keys(req.memberFields); }

					const query = AKSO.db('view_codeholders');
					// This throwns an error if the query is in any way invalid
					QueryUtil.simpleCollection({
						memberFilter: req.memberFilter,
						query: json
					}, schema, query, fieldWhitelist);
					query.toSQL();
				} catch (e) {
					return res.type('text/plain').status(400).send('Invalid filter');
				}
			}
		}

		const data = req.body;
		if ('filters' in req.body) {
			data.filters = JSON.stringify(data.filters);
			data.memberFilter = JSON.stringify(req.memberFilter || {});
		}

		const updated = await AKSO.db('lists')
			.where('id', req.params.listId)
			.update(data);

		res.sendStatus(updated ? 204 : 404);
	}
};
