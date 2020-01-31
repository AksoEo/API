import QueryUtil from 'akso/lib/query-util';

import { schema as codeholderSchemaPar, memberRestrictionFields } from 'akso/workers/http/routing/codeholders/schema';

const codeholderSchema = {
	...codeholderSchemaPar,
	...{
		maxQueryLimit: 100
	}
};

export const schema = {
	defaultFields: [ 'id' ],
	fields: {
		id: 'f',
		name: 'fs',
		description: 's',
		'memberRestrictions.filter': '',
		'memberRestrictions.fields': '',
	},
	fieldAliases: {
		'memberRestrictions.filter': 'filter',
		'memberRestrictions.fields': 'fields'
	},
	alwaysSelect: [ 'filter' ]
};

export function handleMemberRestrictions (memberRestrictions) {
	if (!memberRestrictions) { return; }

	// Verify filter
	const query = AKSO.db('view_codeholders');
	try {
		// This throwns an error if the query is in any way invalid
		QueryUtil.simpleCollection({
			memberFilter: {},
			query: { filter: memberRestrictions.filter }
		}, codeholderSchema, query);
		query.toSQL();
	} catch (e) {
		const err = new Error('memberRestrictions.filter must be a valid codeholder filter');
		err.statusCode = 400;
		throw err;
	}

	// Verify fields
	if (memberRestrictions.fields) {
		for (const [field, flags] of Object.entries(memberRestrictions.fields)) {
			if (!memberRestrictionFields.includes(field)) {
				const err = new Error(`Unknown field ${field} in memberRestrictions.fields`);
				err.statusCode = 400;
				throw err;
			}
			for (const flag of flags) {
				if (!('rw'.includes(flag))) {
					const err = new Error(`Unknown flag ${flag} in memberRestrictions.fields`);
					err.statusCode = 400;
					throw err;
				}
			}
		}
	}
}
