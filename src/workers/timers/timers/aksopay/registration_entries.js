import { createTransaction } from 'akso/util';
import { handlePaidRegistrationEntry } from 'akso/lib/registration-entry-util';

export async function updateProcessingRegistrationEntry () {
	const processingRegistrationEntries = await AKSO.db('registration_entries')
		.select('id')
		.where('status', 'processing')
		.limit(5);

	for (const processingRegistrationEntry of processingRegistrationEntries) {
		// These registration entries have already been processed once by updateTriggeredRegistrationEntry()
		// but turned out to have an issue and were marked pending
		// these issues have now been resolved and it needs to be reprocessed

		try {
			await handlePaidRegistrationEntry(processingRegistrationEntry.id);
		} catch (e) {
			AKSO.log.error(e);
		}
	}
}
updateProcessingRegistrationEntry.intervalMs = 5000; // Check every 5 seconds

export async function updateTriggeredRegistrationEntry () {
	const processableRegistrationEntries = await AKSO.db('view_registration_entries_processable')
		.select('*')
		.limit(5);
	// TODO: There are many continue; statements beneath. We risk never getting through the stack if all five are skipped

	for (const processableRegistrationEntry of processableRegistrationEntries) {
		const amountsAlreadyProcessed = await AKSO.db('view_registration_entries_amountProcessed')
			.where('registrationEntryId', processableRegistrationEntry.registrationEntryId)
			.select('*');
		if (amountsAlreadyProcessed.length > 1) {
			AKSO.log.error(`Registration entry trigger timer: Multiple currencies for ${processableRegistrationEntry.registrationEntryId.toString('hex')}. Skipping`);
			continue;
			// TODO: This happens if there's more than one currency
			// I am not sure if this can even happen, but something other than this is probably preferable
		}
		let totalAlreadyProcessed = 0;
		if (amountsAlreadyProcessed.length) {
			if (processableRegistrationEntry.currencyTriggered !== amountsAlreadyProcessed.currency) {
				AKSO.log.error(`Registration entry trigger timer: Currency mismatch for ${processableRegistrationEntry.registrationEntryId.toString('hex')}. Skipping`);
				continue;
				// TODO: This situation should definitely not be allowed to happen;
				// I am not sure if it even can, though
			}
			totalAlreadyProcessed = amountsAlreadyProcessed[0].amountProcessed;
		}

		const amountNow = totalAlreadyProcessed + processableRegistrationEntry.amountTriggered;

		const registrationEntry = await AKSO.db('registration_entries')
			.where({
				id: processableRegistrationEntry.registrationEntryId,
				status: 'submitted'
			})
			.first('year');
		if (!registrationEntry) {
			// The registration entry no longer exists:
			// it has already been paid for or it was canceled
			continue;
			// TODO: This should potentially create a task in the future
		}

		// Obtain the offers, and make sure amountNow is equivalent to or greater than the offfers total
		const offers = await AKSO.db('registration_entries_offers')
			.where('registrationEntryId', processableRegistrationEntry.registrationEntryId)
			.select('amount');

		const offersSumAmount = offers.map(offer => offer.amount).reduce((a, b) => a + b);

		const trx = await createTransaction();

		if (offersSumAmount <= amountNow) {
			// The full amount of the registration entry has been paid, let us fulfill it
			await handlePaidRegistrationEntry(processableRegistrationEntry.registrationEntryId, trx);
		}

		// Mark as processed
		await trx('registration_entries_triggerHist_processed')
			.insert({
				registrationEntryId: processableRegistrationEntry.registrationEntryId,
				paymentIntentId: processableRegistrationEntry.paymentIntentId,
				pos: processableRegistrationEntry.pos
			});

		await trx.commit();
	}
}
updateTriggeredRegistrationEntry.intervalMs = 5000; // Check every 5 seconds
