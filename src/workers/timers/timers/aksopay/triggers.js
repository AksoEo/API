import AKSOCurrency from 'akso/lib/enums/akso-currency';

export async function triggerTriggerablePurposes () {
	if (!AKSO.cashify) { return; }

	let purposesToTrigger = await AKSO.db('view_pay_triggerable')
		.select('*')
		.limit(50);

	const newTriggerHists = [];

	for (const purpose of purposesToTrigger) {
		const orgCurrency = purpose.triggerAmount_currency || purpose.currency;
		const orgAmount = purpose.triggerAmount_amount || purpose.amount;

		const targetCurrency = purpose.targetCurrency;
		let targetAmount;
		if (targetCurrency === orgCurrency) {
			targetAmount = orgAmount;
		} else {
			const orgCurrencyFactor = AKSOCurrency.getZeroDecimalFactor(orgCurrency);
			const targetCurrencyFactor = AKSOCurrency.getZeroDecimalFactor(targetCurrency);
			targetAmount = targetCurrencyFactor *
				AKSO.cashify.convert(orgAmount / orgCurrencyFactor, { from: orgCurrency, to: targetCurrency });
		}

		newTriggerHists.push({
			paymentIntentId: purpose.paymentIntentId,
			pos: purpose.pos,
			amountTriggered: targetAmount,
			currencyTriggered: targetCurrency,
			time: AKSO.db.raw('UNIX_TIMESTAMP()')
		});
	}

	if (!newTriggerHists.length) { return; }
	await AKSO.db('pay_triggerHist')
		.insert(newTriggerHists);
}
triggerTriggerablePurposes.intervalMs = 5000; // Check every 5 seconds
