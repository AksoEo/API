import nodemailer from 'nodemailer';

import { createConsumer } from 'akso/queue';

let transporter;
export async function init () {
	let transport = AKSO.conf.nodemailer.transport;
	if (transport._type) {
		// TODO: do magic to transform the transport for e.g. brevo
		delete transport._type;
	}

	transporter = nodemailer.createTransport(transport);

	await createConsumer('AKSO_SEND_EMAIL', consumer);
}

async function consumer (data) {
	await transporter.sendMail(data);
}
