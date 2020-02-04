import crypto from 'pn/crypto';

export default {
	schema: {
		query: null,
		body: null,
		requirePerms: 'clients.update'
	},

	run: async function run (req, res) {
		const apiSecret = await crypto.randomBytes(32);
		const apiSecretHashed = crypto.createHash('sha256').update(apiSecret.toString('hex')).digest();

		const updated = await AKSO.db('clients')
			.where('apiKey', req.params.apiKey)
			.update('apiSecret', apiSecretHashed);

		if (!updated) {
			return res.sendStatus(404);
		}

		res.sendObj({
			apiSecret: apiSecret
		});
	}
};
