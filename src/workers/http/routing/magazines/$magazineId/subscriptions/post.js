import moment from 'moment-timezone';
import crypto from 'pn/crypto';
import { base32 } from 'rfc4648';
import path from 'path';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				codeholderId: {
					type: 'integer',
					format: 'uint32'
				},
				year: {
					type: 'number',
					format: 'year'
				},
				internalNotes: {
					type: 'string',
					minLength: 1,
					maxLength: 2000,
					nullable: true
				}
			},
			required: [
				'codeholderId',
				'year'
			],
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		// Find the magazine
		const magazine = await AKSO.db('magazines')
			.where('id', req.params.magazineId)
			.first('org');
		if (!magazine) { return res.sendStatus(404); }

		const orgPerm = 'magazines.subscriptions.create.' + magazine.org;
		if (!req.hasPermission(orgPerm)) {
			return res.type('text/plain').status(403)
				.send('Missing perm magazines.subscriptions.create.<org>');
		}

		const id = await crypto.randomBytes(15);
		const idStr = base32.stringify(id);
		const data = {
			...req.body,
			id,
			createdTime: moment().unix(),
			magazineId: req.params.magazineId,
		};
		await AKSO.db('magazines_subscriptions').insert(data);

		res.set('Location', path.join(AKSO.conf.http.path, 'magazines', req.params.magazineId, 'subscriptions', idStr));
		res.set('X-Identifier', idStr);
		res.sendStatus(201);
	}
};
