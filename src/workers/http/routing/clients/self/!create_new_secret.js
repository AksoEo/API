import crypto from 'pn/crypto';

export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		const apiSecret = await crypto.randomBytes(32);
		const apiSecretHashed = crypto.createHash('sha256').update(apiSecret.toString('hex')).digest();

		await AKSO.db('clients')
			.where('apiKey', req.user.app)
			.update('apiSecret', apiSecretHashed);

		res.sendObj({
			apiSecret: apiSecret
		});
	}
};
