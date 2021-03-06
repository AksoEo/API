import { createCountries } from './countries';
import { createCountryGroups } from './country-groups';

export async function createUniversalData () {
	AKSO.log('... creating countries');
	await createCountries();

	AKSO.log('... creating country groups');
	await createCountryGroups();
}
