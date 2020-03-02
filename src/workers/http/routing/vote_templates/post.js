import path from 'path';

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
			required: [ 'org', 'name', 'vote' ],
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		const orgPerm = 'votes.create.' + req.body.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }
		
		const id = (await AKSO.db('votes_templates').insert({
			...req.body,
			vote: JSON.stringify(req.body.vote)
		}))[0];

		res.set('Location', path.join(AKSO.conf.http.path, 'vote_templates', id.toString()));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
