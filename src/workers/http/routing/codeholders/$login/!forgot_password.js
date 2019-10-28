import moment from 'moment-timezone';
import crypto from 'pn/crypto';
import * as AKSONotif from '../../../../../notif';

export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		// Reply, then deal with it to prevent timing attacks
		res.sendStatus(202);

		// Try to find the codeholder
		const whereStmt = {
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
			.whereNotNull('password')
			.where(function () {
				this
					.where('createPasswordTime', '<', moment().unix() - AKSO.CREATE_PASSWORD_FREQ)
					.orWhere('createPasswordTime', null);
			})
			.first('id', 'newCode');

		if (!codeholder) { return; }

		// Update createPasswordTime and createPasswordKey
		const createPasswordKey = await crypto.randomBytes(16);

		await AKSO.db('codeholders')
			.where('id', codeholder.id)
			.update({
				createPasswordTime: moment().unix(),
				createPasswordKey: createPasswordKey
			});

		// Send the notification
		await AKSONotif.sendNotification({
			codeholderIds: [ codeholder.id ],
			org: 'akso',
			notif: 'forgot-password',
			category: 'account',
			view: {
				code: encodeURIComponent(codeholder.newCode),
				key: createPasswordKey.toString('hex')
			}
		});
	}
};
