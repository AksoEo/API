import QueryUtil from 'akso/lib/query-util';
import CodeholderVoteResource from 'akso/lib/resources/codeholder-vote-resource';

import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('votes_voters')
			.innerJoin('votes', 'voteId', 'id')
			.where('codeholderId', req.user.user);
		await QueryUtil.handleCollection({ req, res, schema, query, Res: CodeholderVoteResource });
	}
};
