import { createCodeholders } from './codeholders';
import { createAdminGroups } from './admin-groups';
import { createRoles } from './roles';
import { createAddressLabelTemplates } from './address-label-templates';
import { createForms } from './forms';
import { createCongresses } from './congresses';
import { createLists } from './lists';
import { createAKSOPay } from './akso-pay';
import { createRegistrationOptions } from './registration-options';
import { createMembershipCategories } from './membership-categories';

export async function createUniversalTestData () {
	AKSO.log('... creating codeholders');
	await createCodeholders();

	AKSO.log('... creating roles');
	await createRoles();

	AKSO.log('... creating admin groups');
	await createAdminGroups();
	
	AKSO.log('... creating address label templates');
	await createAddressLabelTemplates();

	AKSO.log('... creating membership categories');
	await createMembershipCategories();

	AKSO.log('... creating AKSOPay test data');
	await createAKSOPay();

	AKSO.log('... creating forms');
	await createForms();

	AKSO.log('... creating congresses');
	await createCongresses();

	AKSO.log('... creating lists');
	await createLists();

	AKSO.log('... creating registration options');
	await createRegistrationOptions();
}
