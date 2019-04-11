import { schema as parSchema, memberFilter } from '../schema';

const schema = {
	...parSchema,
	...{
		query: null,
		body: null,
		requirePerms: 'codeholders.delete'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Try to find the codeholder
		const queryCodeholder = AKSO.db('view_codeholders');
		queryCodeholder.where('id', req.params.codeholderId);
		queryCodeholder.first(1);

		// Restrictions
		memberFilter(schema, queryCodeholder, req);

		const codeholder = await queryCodeholder;
		if (!codeholder) { return res.sendStatus(404); }

		// Found, perform deletion
		await AKSO.db('codeholders')
			.where('id', req.params.codeholderId)
			.delete();

		res.sendStatus(204);
	}
};
