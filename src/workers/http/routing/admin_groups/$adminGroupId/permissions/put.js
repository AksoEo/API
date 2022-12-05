export default {
	schema: {
		query: null,
		body: {
			type: 'array',
			maxItems: 1023,
			items: {
				type: 'string',
				pattern: '^(\\w+(\\.\\w+)*(\\.\\*)?)|\\*$'
			}
		},
		requirePerms: 'admin_groups.update'
	},

	run: async function run (req, res) {
		// Make sure the admin group exists
		const exists = await AKSO.db('admin_groups')
			.where('id', req.params.adminGroupId)
			.first(1);
		if (!exists) {
			return res.sendStatus(404);
		}

		// Remove duplicates
		const data = [...new Set(req.body)].map(perm => {
			return { adminGroupId: req.params.adminGroupId, permission: perm };
		});

		const trx = await req.createTransaction();

		await trx('admin_permissions_groups')
			.where('adminGroupId', req.params.adminGroupId)
			.delete();

		if (data.length) {
			await trx('admin_permissions_groups')
				.insert(data);
		}

		await trx.commit();

		res.sendStatus(204);
	}
};
