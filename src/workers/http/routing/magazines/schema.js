import QueryUtil from 'akso/lib/query-util';

import { schema as codeholderSchema } from 'akso/workers/http/routing/codeholders/schema';

export const schema = {
	defaultFields: [ 'id' ],
	fields: {
		'id': 'f',
		'org': 'f',
		'name': 'fs',
		'description': 's',
		'issn': '',
		'subscribers': '',
		'subscriberFiltersCompiled': ''
	},
	fieldAliases: {
		subscriberFiltersCompiled: () => AKSO.db.raw('1')
	},
	alwaysSelect: [
		'id',
		'subscribers'
	]
};

const subscribersSubSchema = {
	oneOf: [
		{
			type: 'boolean'
		},
		{
			type: 'object',
			properties: {
				members: {
					oneOf: [
						{
							type: 'boolean'
						},
						{
							type: 'object'
						}
					]
				},
				membersIncludeLastYear: {
					type: 'string',
					pattern: '^P(\\d\\d?Y)?(\\d\\d?M)?(\\d\\d?D)?$',
					minLength: 2,
					nullable: true,
				},
				filter: {
					type: 'object'
				},
				freelyAvailableAfter: {
					type: 'string',
					pattern: '^P(\\d\\d?Y)?(\\d\\d?M)?(\\d\\d?D)?$',
					minLength: 2,
					nullable: true,
				}
			},
			additionalProperties: false
		}
	]
};
export const subscribersSchema = {
	type: 'object',
	properties: {
		access: subscribersSubSchema,
		paper: subscribersSubSchema,
	},
	additionalProperties: false
};

function assertValidCodeholderFilter (filter) {
	const testQuery = AKSO.db('view_codeholders');
	QueryUtil.filter({
		filter: filter,
		query: testQuery,
		fields: Object.keys(codeholderSchema.fields)
			.filter(x => codeholderSchema.fields[x].includes('f')),
		fieldAliases: codeholderSchema.fieldAliases,
		customCompOps: codeholderSchema.customFilterCompOps,
		customLogicOpsFields: codeholderSchema.customFilterLogicOpsFields,
		customLogicOps: codeholderSchema.customFilterLogicOps,
	});
	testQuery.toSQL(); // to actually validate the filter
}

export function setDefaultsSubscribers (subscribers) {
	if (typeof subscribers !== 'object') { return; }
	if (!('access' in subscribers)) { subscribers.access = false; }
	if (!('paper' in subscribers)) { subscribers.paper = false; }

	for (const key in subscribers) {
		if (!(typeof subscribers[key] === 'object')) { continue; }
		subscribers[key] = {
			members: true,
			membersIncludeLastYear: null,
			filter: null,
			freelyAvailableAfter: null,
			...subscribers[key]
		};
	}
}

export function verifySubscribers (subscribers) {
	for (const [key, settings] of Object.entries(subscribers)) {
		if (typeof settings !== 'object') { continue; }

		if (typeof settings.members === 'object' && settings.members) {
			try {
				assertValidCodeholderFilter(settings.members);
			} catch (e) {
				const err = new Error(`Invalid codeholder filter used in subscribers.${key}.members: ${e.message}`);
				err.statusCode = 400;
				throw err;
			}
		}

		if (typeof settings.filter === 'object' && settings.filter) {
			try {
				assertValidCodeholderFilter(settings.filter);
			} catch (e) {
				const err = new Error(`Invalid codeholder filter used in subscribers.${key}.filter: ${e.message}`);
				err.statusCode = 400;
				throw err;
			}
		}
	}
}
