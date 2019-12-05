import { schema as parSchema, getCodeholdersFromVote } from './schema';

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
		// Make sure the user has the necessary perms
		const voteData = await AKSO.db('votes')
			.where('id', req.params.voteId)
			.first('org');
		if (!voteData) { return res.sendStatus(404); }
		if (!req.hasPermission('votes.read.' + voteData.org)) { return res.sendStatus(403); }

		if ('filter' in req.query) {
			return res.status(400).type('text/plain').send('?filter is not allowed');
		}
		if ('search' in req.query) {
			return res.status(400).type('text/plain').send('?search is not allowed');
		}
		if ('order' in req.query) {
			return res.status(400).type('text/plain').send('?order is not allowed');
		}

		res.sendObj(await getCodeholdersFromVote(req.params.voteId, req));
	}
};
