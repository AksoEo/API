import sendgrid from '@sendgrid/mail';

import { createConsumer } from 'akso/queue';

let mail;
export async function init () {
	mail = new sendgrid.MailService();
	mail.setApiKey(AKSO.conf.sendgrid.apiKey);

	await createConsumer('AKSO_SEND_EMAIL', consumer);
}

async function consumer (msg) {
	await mail.send(msg);
}
