import QueryUtil from 'akso/lib/query-util';
import CodeholderDelegationResource from 'akso/lib/resources/codeholder-delegation-resource';
import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: [ 'codeholders.read', 'codeholders.delegations.read.uea' ] // Currently only UEA
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('codeholders_delegations')
			.leftJoin('codeholders_delegations_hosting', {
				'codeholders_delegations_hosting.codeholderId': 'codeholders_delegations.codeholderId',
				'codeholders_delegations_hosting.org': 'codeholders_delegations.org'
			})
			.where('codeholders_delegations.org', 'uea') // Currently only UEA
			.whereExists(function () {
				this.from('view_codeholders')
					.select(1)
					.whereRaw('codeholders_delegations.codeholderId = view_codeholders.id');
				memberFilter(codeholderSchema, this, req);
			});

		await QueryUtil.handleCollection({
			req, res, schema, query, Res: CodeholderDelegationResource,
			passToCol: [[ req, schema ]],
			afterQuery: schema.afterQuery
		});
	}
};
