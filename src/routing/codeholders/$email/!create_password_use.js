import moment from 'moment';
import bcrypt from 'bcrypt';

export default {
	schema: {
		query: null,
		body: {
			properties: {
				key: {
					isBinary: true,
					minBytes: 16,
					maxBytes: 16
				},
				password: {
					type: 'string'
				}
			},
			additionalProperties: false,
			required: [ 'key', 'password' ]
		}
	},

	run: async function run (req, res) {
		// Try to find the codeholder
		const updated = await AKSO.db('codeholders')
			.where({
				email: req.params.email,
				password: null,
				enabled: true,
				isDead: false,
				createPasswordKey: req.body.key
			})
			.where('createPasswordTime', '>=', moment().unix() - AKSO.CREATE_PASSWORD_FREQ)
			.update({
				password: await bcrypt.hash(req.body.password, AKSO.PASSWORD_BCRYPT_SALT_ROUNDS),
				createPasswordTime: null,
				createPasswordKey: null
			});

		if (!updated) { return res.sendStatus(404); }

		// Obtain the internal id
		const codeholder = await AKSO.db('codeholders')
			.first('id')
			.where('email', req.params.email);

		// Update hist
		await AKSO.db('codeholders_hist_password')
			.insert({
				codeholderId: codeholder.id,
				modTime: moment().unix(),
				modBy: 'ch:' + codeholder.id,
				modCmt: AKSO.CODEHOLDER_OWN_CHANGE_CMT
			});

		res.sendStatus(204);
	}
};
