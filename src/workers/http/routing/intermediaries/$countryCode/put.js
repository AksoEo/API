import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				codeholderId: {
					type: 'integer',
					format: 'uint32',
				},
				paymentDescription: {
					type: 'string',
					minLength: 1,
					maxLength: 5000,
					nullable: true,
				},
			},
			additionalProperties: false,
			required: [ 'codeholderId' ],
		},
		requirePerms: ['intermediaries.update', 'codeholders.read']
	},

	run: async function run (req, res) {
		// Verify country code
		const countryCodeExists = await AKSO.db('countries')
			.where({
				code: req.params.countryCode,
				enabled: true,
			})
			.first(1);
		if (!countryCodeExists) {
			return res.type('text/plain').status(400)
				.send('Invalid or disabled countryCode');
		}

		// Ensure the codeholder exists and is visible through the member filter
		const codeholderExistsQuery = AKSO.db('view_codeholders')
			.where({
				enabled: true,
				id: req.body.codeholderId,
			})
			.first(1);
		memberFilter(codeholderSchema, codeholderExistsQuery, req);
		if (!await codeholderExistsQuery) {
			return res.type('text/plain').status(400)
				.send(`Could not find an enabled codeholder with id ${req.body.codeholderId}`);
		}

		await AKSO.db('intermediaries')
			.insert({
				countryCode: req.params.countryCode,
				...req.body
			})
			.onConflict('countryCode')
			.merge();
		res.sendStatus(204);
	}
};
