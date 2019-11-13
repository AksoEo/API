import QueryUtil from 'akso/lib/query-util';
import CodeholderHistResource from 'akso/lib/resources/codeholder-hist-resource';

import { schema as parSchema, memberFilter, memberFieldsManual, histFields } from 'akso/workers/http/routing/codeholders/schema';

const schema = {
	query: 'collection',
	body: null,
	defaultFields: [ 'modId' ],
	fields: {
		modId: 'f',
		modTime: '',
		modBy: '',
		modCmt: '',
		val: ''
	},
	requirePerms: 'codeholders.hist.read'
};

export default {
	schema: schema,

	run: async function run (req, res) {
		if (!(req.params.datum in histFields)) {
			return res.status(400).type('text/plain')
				.send('Unknown codeholder hist datum');
		}

		// Check member fields
		const requiredMemberFields = [
			'id',
			req.params.datum
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'r')) {
			return res.status(403).type('text/plain')
				.send('Missing permitted files codeholder fields, check /perms');
		}

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(parSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		const query = AKSO.db('codeholders_hist_' + req.params.datum);
		query.where('codeholderId', req.params.codeholderId);

		await QueryUtil.handleCollection({
			req,
			res,
			schema: {
				...schema,
				...{
					fieldAliases: {
						val: () => AKSO.db.raw('1')
					},
					alwaysSelect: histFields[req.params.datum].map(field => {
						return QueryUtil.getAlias(parSchema.fieldAliases, field, false);
					})
				}
			},
			query,
			Res: CodeholderHistResource,
			passToCol: [[ req.params.datum ]]
		});
	}
};
