import * as AKSOTelegram from './telegram';
import * as AKSOMail from './mail';

/**
 * Sends a notification to a number of recipients
 * @param  {number[]} options.codeholderIds   The codeholder ids of the recipients
 * @param  {string}   options.org             The organization of the notification
 * @param  {string}   options.notif           The name of the template for the notification
 * @param  {string}   options.category        The category of the notification
 * @param  {Object}   [options.emailConf]     Additional settings to pass to sendgrid emails
 * @param  {Map}      [emailPersonalizations] A `Map` of codeholderId:personalization object
 * @param  {Object}   [tgAttach]              A Telegram attachment object
 * @param  {Object}   [view]                  A view for rendering the notification
 * @param  {KnexTrx}  [db]                    The knex transaction to use for db queries, defaults to AKSO.db
 */
export async function sendNotification ({
	codeholderIds,
	org,
	notif,
	category,
	emailConf = {},
	emailPersonalizations = new Map(),
	tgAttach = undefined,
	view = {},
	db = AKSO.db,
} = {}) {
	if (!codeholderIds.length) { return; }

	// Ensure any dead people are moved from recipients
	const deadCodeholders = await db('view_codeholders')
		.select('id')
		.where('isDead', true)
		.whereIn('id', codeholderIds);
	for (const deadCodeholderId of deadCodeholders) {
		codeholderIds.splice(codeholderIds.indexOf(deadCodeholderId), 1);
	}
	if (!codeholderIds.length) { return; }

	const msgPrefs = new Map();
	for (let id of codeholderIds) {
		msgPrefs.set(parseInt(id, 10), [ 'email' ]); // Default to sending by email
	}

	const msgPrefsDb = await db('codeholders AS c')
		.select('c.id', {
			pref: AKSO.db.raw('COALESCE(np.pref, npg.pref)'),
		})
		.leftJoin('codeholders_notif_pref AS np', function () {
			this.on('np.codeholderId', 'c.id')
				.on(AKSO.db.raw('np.category = ?', [ category ]));
		})
		.leftJoin('codeholders_notif_pref_global AS npg', function () {
			this.on('npg.codeholderId', 'c.id');
		})
		.whereIn('c.id', codeholderIds);

	for (let pref of msgPrefsDb) {
		if (!pref.pref) { continue; }
		msgPrefs.set(pref.id, pref.pref.split(','));
	}

	const recipients = {
		telegram: [],
		email: []
	};
	for (let [id, prefs] of msgPrefs.entries()) {
		for (let pref of prefs) { recipients[pref].push(id); }
	}

	const sendPromises = [];

	// Send Telegram messages
	if (recipients.telegram.length) {
		sendPromises.push(AKSOTelegram.sendNotification({
			codeholderIds: recipients.telegram,
			org: org,
			tmpl: notif,
			view: view,
			attach: tgAttach,
		}));
	}

	// Send emails
	if (recipients.email.length) {
		const personalizations = recipients.email.map(recipient => {
			const personalization = emailPersonalizations.get(recipient) ?? {};
			personalization.to = recipient;
			return personalization;
		});

		sendPromises.push(AKSOMail.renderSendEmail({
			org: org,
			tmpl: notif,
			personalizations: personalizations,
			view: view,
			msgData: emailConf,
			db,
		}));
	}

	await Promise.all(sendPromises);
}
