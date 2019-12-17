import path from 'path';
import crypto from 'pn/crypto';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 200,
					pattern: '^[^\\n]+$'
				},
				ownerName: {
					type: 'string',
					minLength: 1,
					maxLength: 200,
					pattern: '^[^\\n]+$'
				},
				ownerEmail: {
					type: 'string',
					format: 'email',
					minLength: 1,
					maxLength: 200
				}
			},
			required: [
				'name',
				'ownerName',
				'ownerEmail'
			],
			additionalProperties: false
		},
		requirePerms: 'clients.create'
	},

	run: async function run (req, res) {
		const apiKey = await crypto.randomBytes(16);
		const apiSecret = await crypto.randomBytes(32);
		const apiSecretHashed = crypto.createHash('sha256').update(apiSecret.toString('hex')).digest();

		const data = {
			...req.body,
			...{
				apiKey,
				apiSecret: apiSecretHashed
			}
		};

		await AKSO.db('clients').insert(data);

		res.set('Location', path.join(AKSO.conf.http.path, '/clients/', apiKey.toString('hex')));
		res.set('X-Identifier', apiKey.toString('hex'));
		res.status(201).sendObj({
			apiKey: apiKey,
			apiSecret: apiSecret
		});
	}
};
