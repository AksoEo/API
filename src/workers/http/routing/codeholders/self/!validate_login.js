import bcrypt from 'bcrypt';
import notp from 'notp';
import crypto from 'pn/crypto';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			additionalProperties: false,
			minProperties: 1,
			properties: {
				password: {
					type: 'string',
				},
				totp: {
					type: 'string',
					minLength: 6,
					maxLength: 6,
				},
			},
		},
	},

	run: async function run (req, res) {
		const resObj = {};

		if ('password' in req.body) {
			const ch = await AKSO.db('codeholders')
				.first('password')
				.where('id', req.user.user);
			resObj.password = await bcrypt.compare(req.body.password, ch.password);
		}

		if ('totp' in req.body) {
			const totpData = await AKSO.db('codeholders_totp')
				.first('secret', 'iv')
				.where('codeholderId', req.user.user);
			if (!totpData) {
				resObj.totp = null;
			} else {
				// Decrypt the TOTP secret
				const decipher = crypto.createDecipheriv('aes-256-cbc', AKSO.conf.totpAESKey, totpData.iv);
				const secret = Buffer.concat([
					decipher.update(totpData.secret),
					decipher.final()
				]);
				resObj.totp = !!notp.totp.verify(req.body.totp, secret, { window: 2, time: 30 });
			}
		}

		res.sendObj(resObj);
	}
};
