import QueryUtil from 'akso/lib/query-util';
import DelegationApplicationResource from 'akso/lib/resources/delegation-application-resource';
import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: [ 'codeholders.read', 'delegations.applications.read.uea' ] // Currently only UEA
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('delegations_applications')
			.leftJoin('delegations_applications_cities', 'delegations_applications.id', 'delegations_applications_cities.id')
			.where('org', 'uea') // Currently only UEA
			.whereExists(function () {
				this.from('view_codeholders')
					.select(1)
					.whereRaw('delegations_applications.codeholderId = view_codeholders.id');
				memberFilter(codeholderSchema, this, req);
			})
			.groupBy('delegations_applications.id');

		await QueryUtil.handleCollection({
			req, res, schema, query, Res: DelegationApplicationResource,
			passToCol: [[ req, schema ]],
			afterQuery: schema.afterQuery
		});
	}
};
