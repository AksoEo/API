export default {
	schema: {
		query: null,
		body: {
			properties: {
				login: {
					type: 'string',
					oneOf: [
						{
							format: 'email'
						},
						{
							pattern: '^[a-z]{4}([a-z]{2})?$'
						}
					]
				},
				password: {
					type: 'string'
				}
			},
			additionalProperties: false,
			required: [
				'login',
				'password'
			]
		}
	},

	run: async function run (req, res, next) {
		res.send('todo');
	}
};
