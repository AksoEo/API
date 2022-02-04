import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				list: {
					type: 'object',
					patternProperties: {
						'^[^\\n]{1,48}$': {
							type: 'array',
							items: {
								type: 'number',
								format: 'uint32'
							}
						}
					},
					additionalProperties: false,
				}
			},
			required: [ 'list' ],
			additionalProperties: false
		},
		requirePerms: [
			'codeholders.read',
			'org_lists.update'
		]
	},

	run: async function run (req, res) {
		// Verify listName
		if (!req.params.listName.length || req.params.listName.length > 32) {
			return res.sendStatus(404);
		}
		if (req.params.listName.includes('\n')) {
			return res.sendStatus(404);
		}

		// Verify orgs
		const allOrgIds = [].concat(...Object.values(req.body.list));
		const orgQuery = AKSO.db('codeholders')
			.select('id')
			.where('codeholderType', 'org')
			.whereIn('id', allOrgIds);
		memberFilter(codeholderSchema, orgQuery, req);
		const validOrgs = (await orgQuery)
			.map(row => row.id);
		const invalidOrgs = allOrgIds
			.filter(id => !validOrgs.includes(id));
		if (invalidOrgs.length) {
			return res.status(400).type('text/plain')
				.send(`Invalid org id(s): ${invalidOrgs.join(', ')}`);
		}

		const listData = Object.entries(req.body.list).flatMap(entry => {
			return entry[1].map((orgCodeholderId, i) => {
				return {
					listName: req.params.listName,
					tagName: entry[0],
					orgCodeholderId,
					i
				};
			});
		});

		const trx = await req.createTransaction();

		await trx('orgLists')
			.insert({ name: req.params.listName })
			.onConflict('name').ignore();

		await trx('orgLists_orgs')
			.where('listName', req.params.listName)
			.delete();

		if (listData.length) {
			await trx('orgLists_orgs')
				.insert(listData)
				.onConflict('orgCodeholderId').ignore();
		}

		await trx.commit();

		res.sendStatus(204);
	}
};
