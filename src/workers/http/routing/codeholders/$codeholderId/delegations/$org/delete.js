import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';
import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: null,
		body: null,
		requirePerms: [ 'codeholders.read', 'codeholders.delegations.delete.uea' ] // Currently only UEA
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(codeholderSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		const deleted = await AKSO.db('codeholders_delegations')
			.where({
				codeholderId: req.params.codeholderId,
				org: req.params.org
			})
			.delete();

		res.sendStatus(deleted ? 204 : 404);
	}
};
