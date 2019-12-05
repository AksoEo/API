import QueryUtil from 'akso/lib/query-util';

import { schema as listSchema, handleCodeholders } from 'akso/workers/http/routing/lists/public/$listId/codeholders/schema';

const schema = {
	...listSchema,
	...{
		maxQueryLimit: 300,
		defaultFields: [ 'optId' ]
	}
};
schema.fields = {...schema.fields};
schema.fields.optId = '';

schema.fieldAliases = {...schema.fieldAliases};
schema.fieldAliases.optId = () => AKSO.db.raw('1');

export { schema };

export async function getCodeholderQuery (voteId, req) {
	const vote = await AKSO.db('votes')
		.where('id', voteId)
		.first('options');

	if (!vote) {
		const e = new Error();
		e.statusCode = 404;
		throw e;
	}

	const codeholderIds = vote.options
		.filter(opt => {
			return opt.type === 'codeholder';
		})
		.map(opt => opt.codeholderId);

	const query = AKSO.db('view_codeholders')
		.whereIn('id', codeholderIds)
		.orderByRaw(`FIELD(id, ${[...codeholderIds].reverse().join(',')}) DESC`);
	QueryUtil.simpleCollection(req, schema, query);

	return { query: query, options: vote.options };
}

export async function getCodeholdersFromVote (voteId, req) {
	const data = await getCodeholderQuery(voteId, req);
	const codeholders = await data.query;

	if (codeholders.length && codeholders[0].optId) {
		for (let id = 0; id < data.options.length; id++) {
			const opt = data.options[id];
			if (opt.type !== 'codeholder') { continue; }
			for (const ch of codeholders) {
				if (ch.id !== opt.codeholderId) { continue; }
				ch.optId = id;
			}
		}
	}

	return await handleCodeholders(req, codeholders);
}
