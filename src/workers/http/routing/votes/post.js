import path from 'path';

import { postSchema, manualDataValidation } from './schema';

export default {
	schema: {
		query: null,
		body: postSchema
	},

	run: async function run (req, res) {
		const orgPerm = 'votes.create.' + req.body.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		if (await manualDataValidation(req, res) !== true) { return; }
		
		const id = (await AKSO.db('votes').insert(req.body))[0];

		res.set('Location', path.join(AKSO.conf.http.path, 'votes', id.toString()));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
