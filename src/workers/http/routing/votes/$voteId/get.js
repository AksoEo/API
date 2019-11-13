import QueryUtil from 'akso/lib/query-util';
import VoteResource from 'akso/lib/resources/vote-resource';

import { schema as parSchema } from '../schema';

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
		// Make sure the user has the necessary perms
		const orgData = await AKSO.db('votes')
			.where('id', req.params.voteId)
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('votes.read.' + orgData.org)) { return res.sendStatus(403); }

		const query = AKSO.db('votes');
		QueryUtil.simpleResource(req, schema, query);
		query.where('id', req.params.voteId);

		const row = await query;
		const obj = new VoteResource(row);
		res.sendObj(obj);
	}
};
