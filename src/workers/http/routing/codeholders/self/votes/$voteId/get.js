import QueryUtil from 'akso/lib/query-util';
import CodeholderVoteResource from 'akso/lib/resources/codeholder-vote-resource';

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
		const query = AKSO.db('votes_voters')
			.innerJoin('votes', 'voteId', 'id')
			.where({
				codeholderId: req.user.user,
				voteId: req.params.voteId
			});

		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new CodeholderVoteResource(row, req, schema);
		res.sendObj(obj);
	}
};
