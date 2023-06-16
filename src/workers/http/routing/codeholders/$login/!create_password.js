import moment from 'moment-timezone';
import crypto from 'pn/crypto';

import * as AKSOMail from 'akso/mail';
import AKSOOrganization from 'akso/lib/enums/akso-organization';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				org: {
					type: 'string',
					enum: AKSOOrganization.allLower
				}
			},
			required: [ 'org' ],
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		// Reply, then deal with it to prevent timing attacks
		res.sendStatus(202);

		// Try to find the codeholder
		const whereStmt = {
			password: null,
			enabled: true,
			isDead: false
		};
		if (req.params.login.indexOf('@') > -1) {
			whereStmt.email = req.params.login;
		} else if (req.params.login.length === 4) {
			whereStmt.oldCode = req.params.login;
		} else {
			whereStmt.newCode = req.params.login;
		}

		const codeholder = await AKSO.db('codeholders')
			.where(whereStmt)
			.first('id', 'newCode', 'createPasswordTime', 'email');
		if (!codeholder) { return; }

		if (!req.hasPermission('admin')) {
			if (codeholder.createPasswordTime !== null &&
				codeholder.createPasswordTime + AKSO.CREATE_PASSWORD_FREQ > moment().unix()) {
				return;
			}
		}

		// Update createPasswordTime and createPasswordKey
		const createPasswordKey = await crypto.randomBytes(16);
		await AKSO.db('codeholders')
			.where('id', codeholder.id)
			.update({
				createPasswordTime: moment().unix(),
				createPasswordKey: createPasswordKey,
			});

		// Generate email deletion token
		const deleteToken = await crypto.randomBytes(32);
		await AKSO.db('tokens')
			.insert({
				token: deleteToken,
				expiry: moment().add(1, 'day').unix(),
				payload: JSON.stringify({
					email: codeholder.email,
				}),
				ctx: 'DELETE_EMAIL_ADDRESS',
			});

		// Send the email
		await AKSOMail.renderSendNotification({
			org: req.body.org,
			tmpl: 'create-password',
			to: codeholder.id,
			view: {
				code: encodeURIComponent(codeholder.newCode),
				key: createPasswordKey.toString('hex'),
				deleteToken: deleteToken.toString('hex'),
			},
		});
	}
};
