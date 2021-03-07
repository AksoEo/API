import { createCodeholders, setUpCodeholderTotp } from './codeholders';
import { createClients } from './clients';
import { populateAdminGroups } from './admin-groups';

export async function createDevData () {
	AKSO.log('... creating codeholders');
	await createCodeholders();
	await setUpCodeholderTotp();

	AKSO.log('... creating clients');
	await createClients();

	AKSO.log('... populating admin groups');
	await populateAdminGroups();
}
