import fs from 'fs-extra';
import path from 'path';
import tmp from 'tmp-promise';
import msgpack from 'msgpack-lite';
import moment from 'moment-timezone';

/**
 * Schedules a telegram notification to an array of recipients
 * @param {Object} options See `src/workers/telegram/index.js#sendNotification`
 */
export async function sendNotification (options) {
	const scheduleDir = path.join(AKSO.conf.stateDir, 'notifs_telegram');

	const tmpName = await tmp.tmpName({ tmpdir: scheduleDir, prefix: 'tmp-' });
	await fs.writeFile(tmpName, msgpack.encode(options, { codec: AKSO.msgpack }));
	const newName = await tmp.tmpName({ tmpdir: scheduleDir, prefix: 'tg-' + moment().unix(), keep: true });
	await fs.move(tmpName, newName);
}
