import moment from 'moment-timezone';

import { sendTemplate } from 'akso/lib/notif-template-util';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				notifTemplateId: {
					type: 'number',
					format: 'uint32',
				},
				deleteTemplateOnComplete: {
					type: 'boolean',
					default: false,
				},
			},
			required: [
				'notifTemplateId',
			],
			additionalProperties: false,
		},
	},

	run: async function run (req, res) {
		const vote = await AKSO.db('votes')
			.first('*')
			.where('id', req.params.voteId);
		if (!vote) { return res.sendStatus(404); }
		
		const orgPerm = 'votes.update.' + vote.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		if (vote.timeEnd < moment().unix()) {
			return res.sendStatus(409);
		}

		// Try find the notif template
		const notifTemplateData = await AKSO.db('notif_templates')
			.first('org', 'intent')
			.where('id', req.body.notifTemplateId);
		if (!notifTemplateData || !req.hasPermission('notif_templates.read.' + notifTemplateData.org)) {
			return res.status(400).type('text/plain')
				.send('Unknown notif template');
		}
		if (notifTemplateData.intent !== 'vote_cast_ballot') {
			return res.status(400).type('text/plain')
				.send('notif template intent must be vote_cast_ballot');
		}
		if (req.body.deleteTemplateOnComplete && !req.hasPermission('notif_templates.delete.' + notifTemplateData.org)) {
			return res.sendStatus(403);
		}

		// Respond so the client isn't left hanging
		res.sendStatus(202);

		await sendTemplate({
			templateId: req.body.notifTemplateId,
			intentData: {
				'vote.id': vote.id,
				'vote.org': vote.org,
				'vote.name': vote.name,
				'vote.description': vote.description,
				'vote.timeStart': vote.timeStart,
				'vote.timeEnd': vote.timeEnd,
				'vote.hasStarted': vote.timeStart >= moment().unix(),
				'vote.ballotsSecret': !!vote.ballotsSecret,
				'vote.type': vote.type,
				'vote.publishVoters': !!vote.publishVoters,
				'vote.publishResults': !!vote.publishResults,
			},
			queryModifier: query => {
				query
					.innerJoin('votes_voters', 'codeholderId', 'view_codeholders.id')
					.where({
						voteId: vote.id,
						mayVote: true,
						timeVoted: null,
					});
			},
		});

		// Delete the template if necessary
		if (req.body.deleteTemplateOnComplete) {
			await AKSO.db('notif_templates')
				.where('id', req.body.notifTemplateId)
				.delete();
		}
	}
};
