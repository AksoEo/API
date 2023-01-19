import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				codeholders: {
					type: 'array',
					minItems: 1,
					maxItems: 127,
					items: {
						type: 'object',
						additionalProperties: false,
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
						required: [ 'codeholderId' ],
					}
				},
			},
			additionalProperties: false,
			required: [ 'codeholders' ],
		},
		requirePerms: ['intermediaries.update', 'codeholders.read'],
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

		// Ensure the codeholders exist and are visible through the member filter
		const codeholderIds = req.body.codeholders.map(x => x.codeholderId);
		const codeholdersExistQuery = AKSO.db('view_codeholders')
			.where('enabled', true)
			.whereIn('id', codeholderIds)
			.pluck('id')
			.select('id');
		memberFilter(codeholderSchema, codeholdersExistQuery, req);
		const foundCodeholderIds = await codeholdersExistQuery;
		for (const codeholderId of codeholderIds) {
			if (foundCodeholderIds.includes(codeholderId)) { continue; }
			return res.type('text/plain').status(400)
				.send(`Could not find an enabled codeholder with id ${codeholderId}`);
		}

		const trx = await req.createTransaction();

		await trx('intermediaries')
			.where('countryCode', req.params.countryCode)
			.delete();

		await trx('intermediaries')
			.insert(req.body.codeholders.map((codeholder, arrIndex) => {
				return {
					countryCode: req.params.countryCode,
					arrIndex,
					...codeholder,
				};
			}));

		await trx.commit();

		res.sendStatus(204);
	}
};
