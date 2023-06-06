import { addToQueue } from 'akso/queue';

/**
 * Schedules a telegram notification to an array of recipients
 * @param {Object} options See `src/workers/telegram/index.js#sendNotification`
 */
export async function sendNotification (options) {
	await addToQueue('AKSO_SEND_TELEGRAM', options);
}
