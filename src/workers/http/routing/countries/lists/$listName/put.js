import { createTransaction } from 'akso/util';
import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				list: {
					type: 'object',
					additionalProperties: false,
					patternProperties: {
						'^[a-z]{2}$': {
							type: 'array',
							items: {
								type: 'number',
								format: 'uint32'
							}
						}
					}
				}
			},
			required: [ 'list' ],
			additionalProperties: false
		},
		requirePerms: [
			'codeholders.read',
			'countries.lists.update'
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

		// Verify countries
		const validCountries = (
			await AKSO.db('countries')
				.select('code')
				.where('enabled', true)
				.whereIn('code', Object.keys(req.body.list))
		).map(row => row.code);

		const invalidCountries = Object.keys(req.body.list)
			.filter(code => !validCountries.includes(code));
		if (invalidCountries.length) {
			return res.status(400).type('text/plain')
				.send(`Invalid enabled country code(s): ${invalidCountries.join(', ')}`);
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
					country: entry[0],
					orgCodeholderId,
					i
				};
			});
		});

		const trx = await createTransaction();

		await trx('countries_lists')
			.insert({ name: req.params.listName })
			.onConflict('name').ignore();

		await trx('countries_lists_orgs')
			.where('listName', req.params.listName)
			.delete();

		if (listData.length) {
			await trx('countries_lists_orgs')
				.insert(listData)
				.onConflict('orgCodeholderId').ignore();
		}

		await trx.commit();

		res.sendStatus(204);
	}
};
