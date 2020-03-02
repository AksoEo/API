import QueryUtil from 'akso/lib/query-util';
import SimpleResource from 'akso/lib/resources/simple-resource';
import AKSOOrganization from 'akso/lib/enums/akso-organization';

import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const orgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('votes.read.' + org));

		const query = AKSO.db('votes_templates')
			.where('id', req.params.voteTemplateId)
			.whereIn('org', orgs);
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new SimpleResource(row);
		res.sendObj(obj);
	}
};
