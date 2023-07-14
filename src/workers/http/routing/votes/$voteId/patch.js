import moment from 'moment-timezone';

import { patchSchema, manualDataValidation } from '../schema';

const bannedActiveProps = [
	'voterCodeholders',
	'timeStart',
	'ballotsSecret',
	'maxOptionsPerBallot',
	'publishVoters',
	'options',
];

const permittedPropsAfterEnd = [
	'tieBreakerCodeholder',
	'publishResults',
	'publishVotersPercentage',
	'viewerCodeholders',
];

export default {
	schema: {
		query: null,
		body: patchSchema
	},

	run: async function run (req, res) {
		const vote = await AKSO.db('votes')
			.first('*')
			.where('id', req.params.voteId);
		if (!vote) { return res.sendStatus(404); }
		
		const orgPerm = 'votes.update.' + vote.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		const time = moment().unix();
		if (vote.timeEnd < time) {
			for (const prop in req.body) {
				if (permittedPropsAfterEnd.includes(prop)) { continue; }
				return res.type('text/plain').status(400).send(`${prop} is not allowed in PATCH on votes that have ended`);
			}
		}
		if (vote.timeStart <= time) {
			for (const prop of bannedActiveProps) {
				if (prop in req.body) {
					return res.type('text/plain').status(400).send(`${prop} is not allowed in PATCH on active votes`);
				}
			}
		}

		if (await manualDataValidation(req, res, vote) !== true) { return; }

		await AKSO.db('votes')
			.where('id', vote.id)
			.update(req.body);

		// Update viewerCodeholders
		if (req.body.viewerCodeholders && vote.timeStart < time) {
			await AKSO.db('votes_voters')
				.where({
					voteId: vote.id,
					mayVote: false
				})
				.delete();

			await AKSO.db('votes')
				.where('id', vote.id)
				.update('codeholdersSet', false);
		}

		res.sendStatus(204);
	}
};
