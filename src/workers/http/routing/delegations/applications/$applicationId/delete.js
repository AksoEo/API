import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: null,
		body: null,
		requirePerms: [ 'codeholders.read', 'delegations.applications.delete.uea' ] // Currently only UEA
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Find the application if it exists and can be seen through the member filter
		const application = await AKSO.db('delegations_applications')
			.first('codeholderId')
			.whereExists(function () {
				this.from('view_codeholders')
					.select(1)
					.whereRaw('delegations_applications.codeholderId = view_codeholders.id');
				memberFilter(codeholderSchema, this, req);
			})
			.where('id', req.params.applicationId)
			.where('org', 'uea'); // Currently only uea
		if (!application) {
			return res.sendStatus(404);
		}

		await AKSO.db('delegations_applications')
			.where('id', req.params.applicationId)
			.delete();
		res.sendStatus(204);
	}
};
