import { createTransaction } from 'akso/util';

import moment from 'moment-timezone';

/**
 * Updates the statuses of the PaymentIntents with the given IDs
 * @param  {string[]} ids          The ids of the PaymentIntents to update
 * @param  {string}   status       The new status
 * @param  {number}   [time]       The time of the change, defaults to the current time
 * @param  {Object}   [updateData] Additional update data
 */
export async function updateStatuses (ids, status, time = moment().unix(), updateData = {}) {
	if (!updateData.status) {
		updateData.status = status;
	}

	if (status === 'succeeded') {
		updateData.succeededTime = time;
	} else if (status === 'refunded') {
		updateData.refundedTime = time;
	}

	const trx = await createTransaction();

	await Promise.all([
		trx('pay_intents')
			.whereIn('id', ids)
			.update(updateData),

		trx('pay_intents_events')
			.insert(ids.map(id => {
				return {
					paymentIntentId: id,
					time: time,
					status: status
				};
			}))
	]);

	await trx.commit();
}

export function updateStatus (id, ...args) {
	return updateStatuses([id], ...args);
}
