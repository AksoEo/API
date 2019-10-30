import moment from 'moment-timezone';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				ballot: {
					oneOf: [
						{
							type: 'array',
							maxItems: 255
							// There's no items validation as apparently that breaks when the array is empty
						},
						{
							type: 'string',
							enum: [ 'y', 'n', 'b' ]
						}
					]
				}
			},
			required: [
				'ballot'
			],
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		if (!('ballot' in req.body)) { return res.type('text/plain').status(400).send('Missing ballot in body.'); }

		// Obtain info on the vote and make sure the codeholder can vote in it
		const voteData = await AKSO.db('votes')
			.first('*')
			.innerJoin('votes_voters', 'votes.id', 'votes_voters.voteId')
			.where({
				'votes.id': req.params.voteId,
				codeholderId: req.user.user,
				mayVote: true
			});
		if (!voteData) { return res.sendStatus(404); }
		if (voteData.timeEnd <= moment().unix()) { return res.sendStatus(423); }
		if (voteData.ballotsSecret && voteData.timeVoted !== null) { return res.sendStatus(409); }

		let ballot = req.body.ballot;

		if (voteData.type === 'ynb') {
			if (!('ynb'.includes(ballot))) {
				return res.type('text/plain').status(400).send('Invalid ballot for vote of type ynb.');
			}
		} else if (voteData.type === 'yn') {
			if (!('yn'.includes(ballot))) {
				return res.type('text/plain').status(400).send('Invalid ballot for vote of type yn.');
			}
		} else {
			const numOptions = voteData.options.length;
			const usedOptions = [];

			if (voteData.type === 'rp') {
				for (const row of ballot) {
					if (!Array.isArray(row)) {
						return res.type('text/plain').status(400).send('Invalid ballot for vote of type rp.');
					}
					for (const col of row) {
						if (!Number.isSafeInteger(col) || col < 0 || col >= numOptions || usedOptions.includes(col)) {
							return res.type('text/plain').status(400).send('Invalid ballot for vote of type rp.');
						}
						usedOptions.push(col);
					}
				}
				ballot = ballot.map(x => x.join(','));
			} else { // stv, tm
				for (const row of ballot) {
					if (!Number.isSafeInteger(row) || row < 0 || row >= numOptions || usedOptions.includes(row)) {
						return res.type('text/plain').status(400).send(`Invalid ballot for vote of type ${voteData.type}.`);
					}
					usedOptions.push(row);
				}
			}
			if (voteData.type === 'tm') {
				if (ballot.length > voteData.maxOptionsPerBallot) {
					return res.type('text/plain').status(400).send('Too many options on ballot for vote of type tm.');
				}
			}

			ballot = ballot.join('\n');
		}

		let ballotId = voteData.ballotId;

		if (voteData.ballotId) {
			// Update
			await AKSO.db('votes_ballots')
				.where('id', ballotId)
				.update('ballot', ballot);
		} else {
			// Insert
			const query = AKSO.db('votes_ballots')
				.insert({
					voteId: req.params.voteId,
					ballot: ballot
				});
			ballotId = (await query)[0];
		}

		await AKSO.db('votes_voters')
			.where({
				voteId: req.params.voteId,
				codeholderId: req.user.user
			})
			.update({
				timeVoted: moment().unix(),
				ballotId: voteData.ballotsSecret ? null : ballotId
			});

		res.sendStatus(204);
	}
};
