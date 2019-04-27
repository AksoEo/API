import * as AKSOTelegram from './telegram';
import * as AKSOMail from './mail';

/**
 * Sends a notification to a number of recipients
 * @param  {number[]} options.codeholderIds The codeholder ids of the recipients
 * @param  {string}   options.org             The organization of the notification
 * @param  {string}   options.notif           The name of the template for the notification
 * @param  {string}   options.category        The category of the notification
 * @param  {Object}   [options.emailConf]     Additional settings to pass to sendgrid emails
 * @param  {Map}      [emailPersonalizations] A `Map` of codeholderId:personalization object
 * @param  {Object}   [view]                  The view for rendering the notification
 */
export async function sendNotification ({
	codeholderIds,
	org,
	notif,
	category,
	emailConf = {},
	emailPersonalizations = new Map(),
	view = {}
} = {}) {
	const msgPrefs = new Map();
	for (let id of codeholderIds) {
		msgPrefs.set(id, [ 'email' ]); // Default to sending by email
	}

	const msgPrefsDb = await AKSO.db('codeholders_notif_pref')
		.where('category', category)
		.whereIn('codeholderId', codeholderIds)
		.select('codeholderId', 'pref');

	for (let pref of msgPrefsDb) {
		msgPrefs.set(pref.codeholderId, pref.pref.split(','));
	}

	const recipients = {};
	for (let [id, prefs] of msgPrefs.entries()) {
		for (let pref of prefs) {
			if (!(pref in recipients)) { recipients[pref] = []; }
			recipients[pref].push(id);
		}
	}

	// Send Telegram messages
	if (recipients.telegram.length) {
		await AKSOTelegram.sendNotification({
			codeholderIds: recipients.telegram,
			org: org,
			tmpl: notif,
			view: view
		});
	}

	// Send emails
	if (recipients.email.length) {
		const personalizations = recipients.email.map(recipient => {
			const personalization = emailPersonalizations.get(recipient) || {};
			personalization.to = recipient;
			return personalization;
		});

		await AKSOMail.renderSendEmail({
			org: org,
			tmpl: notif,
			personalizations: personalizations,
			view: view,
			msgData: emailConf
		});
	}
}