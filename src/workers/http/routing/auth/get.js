import { isActiveMember } from 'akso/workers/http/lib/codeholder-util';

export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res, next) { // eslint-disable-line no-unused-vars
		if (req.user && req.user.isUser()) {
			const totpData = await AKSO.db.first(1).from('codeholders_totp').where('codeholderId', req.user.user);
			const userData = await AKSO.db.first('id', 'newCode').from('codeholders').where('id', req.user.user);

			const totpSetUp = !!totpData;
			const totpUsed = !!req.session.totp;

			res.sendObj({
				csrfToken: req.csrfToken ? req.csrfToken() : null, // return null if CSRF is disabled
				totpSetUp: totpSetUp,
				totpUsed: totpUsed,
				isAdmin: req.hasPermission('admin'),
				isActiveMember: await isActiveMember(userData.id),
				id: userData.id,
				newCode: userData.newCode
			});
		} else {
			res.sendStatus(404);
		}
	}
};
