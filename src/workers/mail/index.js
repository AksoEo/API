import sendgrid from '@sendgrid/mail';
import path from 'path';
import fs from 'fs-extra';
import msgpack from 'msgpack-lite';
const nodeFs = require('fs').promises;

let mail;

export async function init () {
	mail = new sendgrid.MailService();
	mail.setApiKey(AKSO.conf.sendgrid.apiKey);

	// Set up dir scanning
	scheduleTimer(0);
}

function scheduleTimer (wait = 500) {
	setTimeout(() => { timer().catch(e => { throw e; }); }, wait);
}

async function timer () {
	const scheduleDir = path.join(AKSO.conf.dataDir, 'notifs_mail');
	const dir = await nodeFs.opendir(scheduleDir);
	let entry;
	do {
		entry = await dir.read();
		if (!entry) { break; }
		if (!entry.isFile() || entry.name.indexOf('mail-') !== 0) { continue; }
		const file = path.join(scheduleDir, entry.name);
		const rawData = await fs.readFile(file);
		const data = msgpack.decode(rawData, { codec: AKSO.msgpack });
		await new Promise(resolve => {
			mail.send(data)
				.catch(e => {
					if (e.response.body && e.response.body.errors) {
						AKSO.log.error(e);
						console.log(e.response.body.errors.map(JSON.stringify).join('\n\n')); // eslint-disable-line no-console
					} else {
						throw e;
					}
				})
				.finally(() => {
					fs.unlink(file, resolve);
				});
		});
	} while (entry);
	await dir.close();
	scheduleTimer();
}
