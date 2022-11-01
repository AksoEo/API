import path from 'path';

import { schema as codeholderSchema, memberFilter, memberFieldsManual } from 'akso/workers/http/routing/codeholders/schema';
import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: null,
		body: {
			type: 'object',
			properties: {
				categoryId: {
					type: 'number',
					format: 'uint32'
				},
				year: {
					type: 'number',
					format: 'year'
				},
				canuto: {
					type: 'boolean'
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

		// Make sure the membership entry doesn't already exist
		const entryExists = await AKSO.db('membershipCategories_codeholders')
			.where({
				categoryId: req.body.categoryId,
				codeholderId: req.params.codeholderId,
				year: req.body.year
			})
			.first(1);
		if (entryExists) { return res.sendStatus(409); }

		// Make sure the membership category exists
		const membershipCategory = await AKSO.db('membershipCategories')
			.where('id', req.body.categoryId)
			.first('availableFrom', 'availableTo');

		if (!membershipCategory) { return res.sendStatus(404); }

		// Make sure the year is within the availability bound
		if (membershipCategory.availableFrom && req.body.year < membershipCategory.availableFrom) {
			return res.type('text/plain').status(400).send('year must be greater than or equal to availableFrom');
		}
		if (membershipCategory.availableTo && req.body.year > membershipCategory.availableTo) {
			return res.type('text/plain').status(400).send('year must be lower than or equal to availableTo');
		}

		const id = (await AKSO.db('membershipCategories_codeholders').insert({
			categoryId: req.body.categoryId,
			codeholderId: req.params.codeholderId,
			year: req.body.year,
			canuto: req.body.canuto
		}))[0];

		res.set('Location', path.join(
			AKSO.conf.http.path,
			'codeholders',
			req.params.codeholderId,
			'membership',
			id.toString()
		));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
