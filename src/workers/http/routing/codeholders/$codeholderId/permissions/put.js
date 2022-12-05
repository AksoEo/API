import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

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
		requirePerms: [
			'codeholders.read',
			'codeholders.perms.update'
		]
	},

	run: async function run (req, res) {
		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(codeholderSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		// Remove duplicates
		const data = [...new Set(req.body)].map(perm => {
			return { codeholderId: req.params.codeholderId, permission: perm };
		});

		const trx = await req.createTransaction();
		await trx('admin_permissions_codeholders')
			.where('codeholderId', req.params.codeholderId)
			.delete();

		if (data.length) {
			await trx('admin_permissions_codeholders')
				.insert(data);
		}
		await trx.commit();

		res.sendStatus(204);
	}
};
