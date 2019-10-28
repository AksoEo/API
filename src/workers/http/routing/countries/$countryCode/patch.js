export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				enabled: {
					type: 'boolean'
				},
				name_eo: {
					type: 'string',
					minLength: 1,
					maxLength: 150,
					pattern: '^[^\\n]+$'
				},
				name_en: {
					type: 'string',
					minLength: 1,
					maxLength: 150,
					pattern: '^[^\\n]+$'
				},
				name_fr: {
					type: 'string',
					minLength: 1,
					maxLength: 150,
					pattern: '^[^\\n]+$'
				},
				name_es: {
					type: 'string',
					minLength: 1,
					maxLength: 150,
					pattern: '^[^\\n]+$'
				},
				name_nl: {
					type: 'string',
					minLength: 1,
					maxLength: 150,
					pattern: '^[^\\n]+$'
				},
				name_pt: {
					type: 'string',
					minLength: 1,
					maxLength: 150,
					pattern: '^[^\\n]+$'
				},
				name_sk: {
					type: 'string',
					minLength: 1,
					maxLength: 150,
					pattern: '^[^\\n]+$'
				},
				name_zh: {
					type: 'string',
					minLength: 1,
					maxLength: 150,
					pattern: '^[^\\n]+$'
				},
				name_de: {
					type: 'string',
					minLength: 1,
					maxLength: 150,
					pattern: '^[^\\n]+$'
				}
			},
			minProperties: 1,
			additionalProperties: false
		},
		requirePerms: 'countries.update'
	},

	run: async function run (req, res) {
		const updated = await AKSO.db('countries')
			.where('code', req.params.countryCode)
			.update(req.body);

		if (updated) {
			res.sendStatus(204);
		} else {
			res.sendStatus(404);
		}
	}
};
