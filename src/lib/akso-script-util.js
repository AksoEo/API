import { evaluate as nativeEvaluate, stdlibExt, stdlib } from '@tejo/akso-script';
import '@tejo/akso-script/phone_fmt';

let countriesList = null;

let cacheTime = 0;
const MAX_CACHE_AGE = 60 * 1000; // 1 min

async function updateCountriesCache () {
	const now = Date.now();
	if (cacheTime < now - MAX_CACHE_AGE) {
		cacheTime = now;
		const countriesArr = await AKSO.db('countries')
			.select('code', 'name_eo');
		const newCountriesList = [];
		countriesArr.forEach(obj => {
			newCountriesList[obj.code] = obj.name_eo;
		});
		countriesList = newCountriesList;
	}
}
stdlibExt.getCountryName = name => countriesList[name] || null;

export async function doAscMagic() {
	await updateCountriesCache();
}

export async function evaluate (...args) {
	await doAscMagic();
	return evaluateSync(...args);
}

export function evaluateSync (definitions, id, getFormValue, options) {
	let opCount = 0;
	if (!options) {
		options = {
			shouldHalt: () => opCount++ > 4096,
		};
	}
	try {
		return nativeEvaluate(definitions, id, getFormValue, options);
	} catch (e) {
		if (e.message === 'Terminated by shouldHalt') {
			const err = new Error('asc was terminated due to shouldHalt');
			err.statusCode = 400;
			throw err;
		}
		throw e;
	}
}

export function formatCurrency (amt, currency, currencyName = true) {
	let str = stdlib.currency_fmt.apply(null, [ currency || '?', amt ]);
	if (!currencyName) {
		str = str.substring(0, str.length - 4);
	}
	return str;
}
