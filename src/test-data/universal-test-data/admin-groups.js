export async function createAdminGroups () {
	await AKSO.db('admin_groups')
		.insert([
			{
				id: 1,
				name: 'Ĉefadministranto',
				description: 'Havas ĉiujn rajtojn'
			}
		]);

	await AKSO.db('admin_permissions_groups')
		.insert([
			{
				adminGroupId: 1,
				permission: '*'
			}
		]);

	await AKSO.db('admin_permissions_memberRestrictions_groups')
		.insert([
			{
				adminGroupId: 1,
				filter: '{}',
				fields: null
			}
		]);
}
