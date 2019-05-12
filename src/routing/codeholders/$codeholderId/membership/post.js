import path from 'path';

import { schema as codeholderSchema, memberFilter, memberFieldsManual } from '../../schema';
import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: null,
		body: {
			properties: {
				categoryId: {
					type: 'number',
					format: 'uint32'
				},
				year: {
					type: 'number',
					format: 'year'
				}
			},
			required: [ 'categoryId', 'year' ],
			additionalProperties: false
		},
		requirePerms: 'codeholders.update'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Check member fields
		const requiredMemberFields = [
			'membership'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'w')) {
			return res.status(403).type('text/plain').send('Missing permitted files codeholder fields, check /perms');
		}

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(codeholderSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		// Make sure the membership category exists
		const membershipCategoryExists = await AKSO.db('membershipCategories')
			.where('id', req.body.categoryId)
			.first(1);

		if (!membershipCategoryExists) { return res.sendStatus(404); }

		const id = (await AKSO.db('membershipCategories_codeholders').insert({
			categoryId: req.body.categoryId,
			codeholderId: req.params.codeholderId,
			year: req.body.year
		}))[0];

		res.set('Location', path.join(AKSO.conf.http.path, 'codeholders', req.params.codeholderId, 'membership', id.toString()));
		res.sendStatus(201);
	}
};
