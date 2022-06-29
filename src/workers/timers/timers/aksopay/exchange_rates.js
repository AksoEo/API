import fs from 'fs-extra';
import path from 'path';
import fetch from 'node-fetch';
import moment from 'moment-timezone';

export async function updateExchangeRatesIfNeeded () {
	const exchangeRatesPath = path.join(AKSO.conf.stateDir, 'exchange_rates.json');

	// Check if the stored exchange rates are outdated
	let stat;
	try {
		stat = await fs.stat(exchangeRatesPath);
	} catch {
		// noop
	}
	let needUpdateFile = !stat;
	if (stat) {
		const timeDiff = moment().unix() - moment(stat.mtime).unix();
		if (timeDiff > AKSO.EXCHANGE_RATES_LIFETIME) { needUpdateFile = true; }
	}

	let rates;
	if (needUpdateFile) {
		try {
			const res = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${AKSO.conf.openExchangeRatesAppID}`);
			rates = await res.json();
			if (rates.error) {
				AKSO.log.error(rates);
				await fs.utimes(exchangeRatesPath, stat.atime, new Date());
			} else {
				await fs.writeJSON(exchangeRatesPath, rates);
			}
		} catch (e) {
			AKSO.log.error('Failed to update exchange rates');
			AKSO.log.error(e);
		}
	}

	// TODO: Only read the file if stat says outdated
	if (!rates) {
		rates = await fs.readJSON(exchangeRatesPath);
	}

	process.send({
		forward: true,
		action: 'set_exchange_rates',
		data: rates
	});
}
updateExchangeRatesIfNeeded.intervalMs = 1000 * 60 * 10; // Check every 10 minutes