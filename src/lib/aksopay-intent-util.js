import { createTransaction } from 'akso/util';
import { renderSendEmail } from 'akso/mail';

import { afterQuery } from 'akso/workers/http/routing/aksopay/payment_intents/schema';

import moment from 'moment-timezone';
import { base32 } from 'rfc4648';

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
		updateData.statusTime = time;
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

export async function sendReceiptEmail (id, email = undefined) {
	// Try to find the intent
	const intent = await AKSO.db('pay_intents')
		.first(
			'customer_email', 'customer_name', 'paymentMethod', 'currency',
			'org', 'succeededTime', 'intermediaryCountryCode', {
				purposes: 1,
			})
		.where({
			id,
			status: 'succeeded'
		});
	if (!intent) {
		throw new Error('unknown intent');
	}
	if (!email) {
		email = intent.customer_email;
	}
	if (!email) {
		throw new Error('no customer email, cannot send receipt');
	}

	// Obtain purposes etc.
	await afterQuery([intent]);

	const isDonation = intent.purposes
		.filter(purpose => {
			if (purpose.type === 'trigger') { return true; }
			return false;
		})
		.length === 0;

	await renderSendEmail({
		org: intent.org,
		tmpl: 'aksopay-receipt',
		personalizations: { to: [{
			email,
			name: intent.customer_name,
		}]},
		view: {
			intent,
			isDonation,
			idEncoded: base32.stringify(intent.id),
			totalAmount: intent.purposes
				.map(p => p.amount)
				.reduce((a, b) => a + b),
		},
	});
}
