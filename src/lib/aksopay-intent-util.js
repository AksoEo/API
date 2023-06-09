import { createTransaction, arrToObjByKey } from 'akso/util';
import { renderSendNotification } from 'akso/mail';

import { afterQuery as intentAfterQuery } from 'akso/workers/http/routing/aksopay/payment_intents/schema';
import { afterQuery as registrationEntryAfterQuery } from 'akso/workers/http/routing/registration/entries/schema';

import moment from 'moment-timezone';
import { base32 } from 'rfc4648';

/**
 * Updates the statuses of the PaymentIntents with the given IDs
 * @param  {string[]} ids          The ids of the PaymentIntents to update
 * @param  {string}   status       The new status
 * @param  {number}   [time]       The time of the change, defaults to the current time
 * @param  {Object}   [updateData] Additional update data
 */
export async function updateStatuses (ids, status, time = moment().unix(), updateData = {}, sendReceipt = true) {
	// Obtain existing intent info
	const paymentIntentsArr = await AKSO.db('pay_intents')
		.select('id', 'statusTime')
		.whereIn('id', ids);
	const paymentIntentsStatusTime = {};
	for (const paymentIntent of paymentIntentsArr) {
		paymentIntentsStatusTime[paymentIntent.id.toString('hex')] = paymentIntent.statusTime;
	}

	const updateDataById = {};

	for (const id of ids) {
		const hexId = id.toString('hex');
		const statusTime = paymentIntentsStatusTime[hexId];
		const data = updateDataById[hexId] = {};

		if (!updateData.status && statusTime <= time) {
			data.status = status;
			data.statusTime = time;
		}

		if (status === 'succeeded') {
			data.succeededTime = time;
		} else if (status === 'refunded') {
			data.refundedTime = time;
		}
	}

	const trx = await createTransaction();

	const promises = [
		trx('pay_intents_events')
			.insert(ids.map(id => {
				return {
					paymentIntentId: id,
					time: time,
					status: status,
				};
			}))
	];

	if (Object.keys(updateData).length) {
		promises.push(
			trx('pay_intents')
				.whereIn('id', ids)
				.update(updateData)
		);
	}

	for (const [id, data] of Object.entries(updateDataById)) {
		promises.push(
			trx('pay_intents')
				.where('id', Buffer.from(id, 'hex'))
				.update(data)
		);
	}

	await Promise.all(promises);
	await trx.commit();

	if (status === 'succeeded' && sendReceipt) {
		for (const id of ids) {
			try {
				await sendReceiptEmail(id);
			} catch (e) {
				if (!e.isAKSO) { throw e; }
				// Errors with isAKSO are fine to ignore
			}
		}
	}
}

export function updateStatus (id, ...args) {
	return updateStatuses([id], ...args);
}

async function getIntentData (intent) {
	// Obtain purposes etc.
	await new Promise(resolve => intentAfterQuery([intent], resolve));
	for (const purpose of intent.purposes) {
		if (purpose.type !== 'trigger') { continue; }
		if (purpose.triggers !== 'registration_entry') { continue; }
		purpose._registrationEntryIdHex = purpose.registrationEntryId.toString('hex');
	}

	const isDonation = intent.purposes
		.filter(purpose => {
			if (purpose.type === 'trigger') { return true; }
			return false;
		})
		.length === 0;

	const registrationEntryIds = intent.purposes
		.filter(purpose =>
			purpose.type === 'trigger'
			&& purpose.triggers === 'registration_entry')
		.map(purpose => purpose.registrationEntryId);
	const registrationEntryInfoRaw = await AKSO.db('registration_entries')
		.select('id', { offers: 1 })
		.whereIn('id', registrationEntryIds);
	await new Promise(resolve => registrationEntryAfterQuery(registrationEntryInfoRaw, resolve));
	
	const magazineIds = registrationEntryInfoRaw
		.flatMap(registrationEntry => registrationEntry.offers)
		.filter(offer => offer.type === 'magazine')
		.map(offer => offer.id);
	const magazines = arrToObjByKey(
		await AKSO.db('magazines')
			.select('id', 'name')
			.whereIn('id', magazineIds),
		'id'
	);

	const membershipCategoryIds = registrationEntryInfoRaw
		.flatMap(registrationEntry => registrationEntry.offers)
		.filter(offer => offer.type === 'membership')
		.map(offer => offer.id);
	const membershipCategories = arrToObjByKey(
		await AKSO.db('membershipCategories')
			.select('id', 'name', 'nameAbbrev')
			.whereIn('id', membershipCategoryIds),
		'id'
	);

	const registrationEntryInfo = {};
	for (const registrationEntry of registrationEntryInfoRaw) {
		const idHex = registrationEntry.id.toString('hex');
		registrationEntryInfo[idHex] = registrationEntry.offers
			.map(offer => {
				if (offer.type === 'membership') {
					const membershipCategory = membershipCategories[offer.id][0];
					return `${membershipCategory.name} (${membershipCategory.nameAbbrev})`;
				} else if (offer.type === 'magazine') {
					const magazine = magazines[offer.id][0];
					return `${offer.paperVersion ? 'Papera' : 'Reta'} revuo ${magazine.name}`;
				}
			});
	}

	return {
		isDonation, registrationEntryInfo,
	};
}

export async function sendReceiptEmail (id, email = undefined) {
	// Try to find the intent
	const intent = await AKSO.db('pay_intents')
		.first(
			'id', 'customer_email', 'customer_name', 'paymentMethod', 'currency',
			'org', 'succeededTime', 'intermediaryCountryCode', {
				purposes: 1,
			})
		.where({
			id,
			status: 'succeeded',
		});
	if (!intent) {
		const err = new Error('unknown intent');
		err.isAKSO = true;
		throw err;
	}
	if (!email) {
		email = intent.customer_email;
	}
	if (!email) {
		const err = new Error('no customer email, cannot send receipt');
		err.isAKSO = true;
		throw err;
	}

	const intentData = await getIntentData(intent);

	await renderSendNotification({
		org: intent.org,
		tmpl: 'aksopay-receipt',
		to: [{
			address: email,
			name: intent.customer_name,
		}],
		view: {
			...intentData,
			intent,
			idEncoded: base32.stringify(intent.id),
			totalAmount: intent.purposes
				.map(p => p.amount)
				.reduce((a, b) => a + b),
		},
	});
}

export async function sendInstructionsEmail (id) {
	// Try to find the intent
	const intent = await AKSO.db('pay_intents')
		.first(
			'id', 'customer_email', 'customer_name', 'paymentMethod', 'currency',
			'org', 'succeededTime', 'intermediaryCountryCode', 'timeCreated', {
				purposes: 1,
			})
		.where({
			id,
			status: 'pending',
		});
	if (!intent) {
		const err = new Error('unknown intent');
		err.isAKSO = true;
		throw err;
	}
	if (!intent.customer_email) {
		const err = new Error('no customer email, cannot send receipt');
		throw err;
	}
	if (intent.paymentMethod.type === 'stripe') {
		const err = new Error('cannot send instruction emails for payment methods of type stripe');
		throw err;
	}

	const intentData = await getIntentData(intent);

	let validityStr = null;
	if (intent.paymentMethod.paymentValidity) {
		validityStr = moment(1000 * intent.timeCreated + intent.paymentMethod.paymentValidity)
			.format('YYYY-MM-DD HH:mm:ss [UTC]');
	}

	const idEncoded = base32.stringify(intent.id);
	const paymentFacilitatorURL = new URL('i/' + idEncoded, AKSO.conf.paymentFacilitator);

	await renderSendNotification({
		org: intent.org,
		tmpl: 'aksopay-instructions',
		to: [{
			address: intent.customer_email,
			name: intent.customer_name,
		}],
		view: {
			...intentData,
			intent,
			idEncoded,
			totalAmount: intent.purposes
				.map(p => p.amount)
				.reduce((a, b) => a + b),
			paymentFacilitatorURL,
			validityStr,
		},
	});
}
