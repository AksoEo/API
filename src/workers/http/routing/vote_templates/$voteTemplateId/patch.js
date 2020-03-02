import AKSOOrganization from 'akso/lib/enums/akso-organization';

import { templateSchema as voteSchema } from 'akso/workers/http/routing/votes/schema';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				org: {
					type: 'string',
					enum: AKSOOrganization.allLower.filter(x => x !== 'akso')
				},
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 100,
					pattern: '^[^\\n]+$'
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 2000,
					nullable: true
				},
				vote: voteSchema
			},
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		const orgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('votes.read.' + org));
		
		const data = { ...req.body };
		if ('vote' in data) {
			data.vote = JSON.stringify(data.vote);
		}

		const updated = await AKSO.db('votes_templates')
			.where('id', req.params.voteTemplateId)
			.whereIn('org', orgs)
			.update(data);

		res.sendStatus(updated ? 204 : 404);
	}
};
