export async function populateAdminGroups () {
	await AKSO.db('admin_groups_members_clients')
		.insert([
			{
				adminGroupId: 1,
				apiKey: Buffer.from('0e5417fdf9edb4667ccd6de525300bd8', 'hex')
			}
		]);

	await AKSO.db('admin_groups_members_codeholders')
		.insert([
			{
				adminGroupId: 1,
				codeholderId: (await AKSO.db('codeholders').where('newCode', 'dooder').first('id')).id
			},
			{
				adminGroupId: 1,
				codeholderId: (await AKSO.db('codeholders').where('newCode', 'xxtejo').first('id')).id
			}
		]);
}
