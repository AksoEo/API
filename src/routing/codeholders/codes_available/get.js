export default {
	schema: {
		query: {
			type: 'object',
			properties: {
				codes: {
					type: 'string',
					pattern: '^[a-z]{6}(,[a-z]{6}){0,99}$'
				}
			},
			required: [ 'codes' ],
			additionalProperties: false
		},
		body: null,
		requirePerms: 'codeholders.read'
	},

	run: async function run (req, res) {
		const codes = req.query.codes.split(',');

		const availability = await AKSO.db('codeholders')
			.select('newCode')
			.whereIn('newCode', codes);

		const response = {};
		for (let code of codes) {
			response[code] = { available: true };
		}
		for (let row of availability) {
			response[row.newCode].available = false;
		}

		res.sendObj(response);
	}
};
