import moment from 'moment-timezone';
import bcrypt from 'bcrypt';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
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
		const whereStmt = {};
		if (req.params.login.indexOf('@') > -1) {
			whereStmt.email = req.params.login;
		} else if (req.params.login.length === 4) {
			whereStmt.oldCode = req.params.login;
		} else {
			whereStmt.newCode = req.params.login;
		}
		const updated = await AKSO.db('codeholders')
			.where({
				...whereStmt,
				...{
					enabled: true,
					isDead: false,
					createPasswordKey: req.body.key
				}})
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
			.where(whereStmt);

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
