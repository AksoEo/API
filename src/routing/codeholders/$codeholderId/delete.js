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
		const query = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.delete();
		memberFilter(parSchema, query, req);

		const deleted = await query;
		if (deleted) { res.sendStatus(204); }
		else { res.sendStatus(404); }
	}
};
