import { evaluate as nativeEvaluate, stdlibExt } from '@tejo/akso-script';
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
	return nativeEvaluate(...args);
}

export function evaluateSync (...args) {
	return nativeEvaluate(...args);
}
