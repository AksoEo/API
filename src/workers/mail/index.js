import nodemailer from 'nodemailer';

import { createConsumer, WorkerQueues } from 'akso/queue';

let transporter;
export async function init () {
	const transport = AKSO.conf.nodemailer.transport;
	transporter = nodemailer.createTransport(transport);

	await createConsumer(WorkerQueues.SEND_EMAIL, consumer);
}

async function consumer (data) {
	await transporter.sendMail(data);
}
