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

function scheduleTimer (wait = 5000) {
	setTimeout(() => {
		timer().catch(e => {
			AKSO.log.error(e);
			console.error(e); // eslint-disable-line no-console
			process.exit(1);
		});
	}, wait);
}

async function timer () {
	const scheduleDir = path.join(AKSO.conf.stateDir, 'notifs_mail');
	const dir = await nodeFs.opendir(scheduleDir);
	let entry;
	do {
		entry = await dir.read();
		if (!entry) { break; }
		if (!entry.isFile() || entry.name.indexOf('mail-') !== 0) { continue; }
		const file = path.join(scheduleDir, entry.name);
		const rawData = await fs.readFile(file);
		const data = msgpack.decode(rawData, { codec: AKSO.msgpack });

		try {
			await mail.send(data);
			await fs.unlink(file);
		} catch (e) {
			AKSO.log.error(e);
			if (e.response && e.response.body && e.response.body.errors) {
				console.error(e.response.body.errors.map(JSON.stringify).join('\n\n')); // eslint-disable-line no-console
			}

			const newName = entry.name.replace('mail-', 'err-');
			await fs.move(file, path.join(scheduleDir, newName));
		}
	} while (entry);
	await dir.close();
	scheduleTimer();
}
