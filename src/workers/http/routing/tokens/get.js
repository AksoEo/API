export default {
	schema: {
		body: null,
		query: {
			type: 'object',
			properties: {
				token: {
					type: 'string',
					minLength: 64,
					maxLength: 64,
				},
				ctx: {
					type: 'string',
					minLength: 1,
					maxLength: 24,
				},
			},
			required: [ 'token', 'ctx' ],
			additionalProperties: false,
		},
	},

	run: async function run (req, res) {
		const token = Buffer.from(req.query.token, 'hex');
		const ctx = req.query.ctx.toUpperCase();

		const tokenData = await AKSO.db('tokens')
			.first('payload')
			.where({
				token, ctx,
			});
		if (!tokenData) {
			return res.sendStatus(404);
		}

		res.sendObj(tokenData.payload);
	},
};
