import moment from 'moment-timezone';
import { default as merge } from 'deepmerge';

import QueryUtil from 'akso/lib/query-util';
import AKSOOrganization from 'akso/lib/enums/akso-organization';

import { schema as codeholderSchema, memberFilter } from '../codeholders/schema';

export const schema = {
	defaultFields: [ 'id' ],
	fields: {
		'id': 'f',
		'org': 'f',
		'name': 'fs',
		'description': 's',
		'voterCodeholders': '',
		'voterCodeholdersMemberFilter': '',
		'viewerCodeholders': '',
		'viewerCodeholdersMemberFilter': '',
		'timeStart': 'f',
		'timeEnd': 'f',
		'usedTieBreaker': '',
		'hasResults': 'f',
		'hasStarted': 'f',
		'hasEnded': 'f',
		'isActive': 'f',
		'ballotsSecret': '',
		'type': 'f',
		'blankBallotsLimit': '',
		'blankBallotsLimitInclusive': '',
		'quorum': '',
		'quorumInclusive': '',
		'majorityBallots': '',
		'majorityBallotsInclusive': '',
		'majorityVoters': '',
		'majorityVotersInclusive': '',
		'majorityMustReachBoth': '',
		'numChosenOptions': '',
		'mentionThreshold': '',
		'mentionThresholdInclusive': '',
		'maxOptionsPerBallot': '',
		'tieBreakerCodeholder': '',
		'publishVoters': '',
		'publishVotersPercentage': '',
		'publishResults': '',
		'options': ''
	},
	fieldAliases: {
		hasStarted: () => AKSO.db.raw('timeStart <= UNIX_TIMESTAMP()'),
		hasEnded: () => AKSO.db.raw('timeEnd <= UNIX_TIMESTAMP()'),
		isActive: () => AKSO.db.raw('timeStart <= UNIX_TIMESTAMP() AND timeEnd > UNIX_TIMESTAMP()'),
		usedTieBreaker: () => AKSO.db.raw('tieBreakerBallot IS NOT NULL')
	}
};

export async function manualDataValidation (req, res, vote = undefined) {
	const validateFilterArr = [];
	const validateFilter = { $and: [
		req.memberFilter,
		{
			$or: validateFilterArr
		}
	] };
	if (req.body.voterCodeholders) {
		validateFilterArr.push(req.body.voterCodeholders);
	}
	if (req.body.viewerCodeholders) {
		validateFilterArr.push(req.body.viewerCodeholders);
	}
	if (validateFilterArr.length) {
		try {
			const query = AKSO.db('view_codeholders');
			QueryUtil.filter({
				fields: codeholderSchema.fields,
				fieldAliases: codeholderSchema.fieldAliases,
				fieldWhitelist: req.memberFields ? Object.keys(req.memberFields) : null,
				customCompOps: codeholderSchema.customFilterCompOps,
				customLogicOpsFields: codeholderSchema.customFilterLogicOpsFields,
				customLogicOps: codeholderSchema.customFilterLogicOps,
				query,
				filter: validateFilter
			});
			await query;
		} catch (e) {
			return res.status(400).type('text/plain').send('Invalid voterCodeholders or viewerCodeholders');
		}
	}
	if (req.body.voterCodeholders) {
		req.body.voterCodeholders = JSON.stringify(req.body.voterCodeholders);
		req.body.voterCodeholdersMemberFilter = JSON.stringify(req.memberFilter);
	}
	if (req.body.viewerCodeholders) {
		req.body.viewerCodeholders = JSON.stringify(req.body.viewerCodeholders);
		req.body.viewerCodeholdersMemberFilter = JSON.stringify(req.memberFilter);
	}
	
	if (req.body.timeStart && req.body.timeStart < moment().unix()) {
		return res.status(400).type('text/plain').send('timeStart must not be lower than the current unix time');
	}
	if (req.body.timeEnd && req.body.timeEnd < (req.body.timeStart || vote.timeStart)) {
		return res.status(400).type('text/plain').send('timeEnd must not be lower than timeStart');
	}

	// Convert oneNumberOrFraction
	const oneNumberOrFractions = [
		'blankBallotsLimit',
		'quorum',
		'majorityBallots',
		'majorityVoters',
		'mentionThreshold'
	];
	for (const key of oneNumberOrFractions) {
		if (!(key in req.body)) { continue; }
		req.body[key] = oneNumberOrFractionToStr(req.body[key]);
	}

	if (req.body.options || (vote && vote.options)) {
		const options = req.body.options || vote.options;
		if ('numChosenOptions' in req.body) {
			if (req.body.numChosenOptions > options.length) {
				return res.status(400).type('text/plain').send('numChosenOptions must not be greater than the amount of options');
			}
		}
		if ('maxOptionsPerBallot' in req.body) {
			if (req.body.maxOptionsPerBallot > options.length) {
				return res.status(400).type('text/plain').send('maxOptionsPerBallot must not be greater than the amount of options');
			}
		}
	}

	if ('tieBreakerCodeholder' in req.body) {
		const existsQuery = AKSO.db('codeholders')
			.first(1)
			.where('id', req.body.tieBreakerCodeholder);
		memberFilter(codeholderSchema, existsQuery, req);
		const exists = await existsQuery;
		if (!exists) {
			return res.status(400).type('text/plain').send('Unknown tieBreakerCodeholder');
		}
	}
	if ('options' in req.body) {
		for (const opt of req.body.options) {
			if (!opt.description) { opt.description = null; }
		}
		req.body.options = JSON.stringify(req.body.options);
	}

	return true;
}

export const oneNumberOrFractionPattern = {
	oneOf: [
		{
			type: 'number',
			minimum: 0,
			maximum: 1
		},
		{
			type: 'array',
			minItems: 2,
			maxItems: 2,
			items: {
				type: 'integer',
				format: 'uint8'
			}
		}
	]
};

export function oneNumberOrFractionToStr (num) {
	if (typeof num === 'number') { return num.toString(); }
	else { return num.join('/'); }
}

const getSchema = type => {
	return {
		type: 'object',
		properties: {
			org: {
				type: 'string',
				enum: AKSOOrganization.allLower.filter(x => x !== 'akso')
			},
			name: {
				type: 'string',
				minLength: 1,
				maxLength: 100,
				pattern: '^[^\\n]+$'
			},
			description: {
				type: 'string',
				minLength: 1,
				maxLength: 10000,
				nullable: true
			},
			voterCodeholders: {
				type: 'object'
			},
			viewerCodeholders: {
				type: 'object',
				nullable: true
			},
			timeStart: {
				type: 'integer',
				format: 'uint64'
			},
			timeEnd: {
				type: 'integer',
				format: 'uint64'
			},
			ballotsSecret: {
				type: 'boolean'
			},
			type: {
				type: 'string',
				const: type
			},
			blankBallotsLimit: oneNumberOrFractionPattern,
			blankBallotsLimitInclusive: {
				type: 'boolean'
			},
			quorum: oneNumberOrFractionPattern,
			quorumInclusive: {
				type: 'boolean'
			},
			majorityBallots: oneNumberOrFractionPattern,
			majorityBallotsInclusive: {
				type: 'boolean'
			},
			majorityVoters: oneNumberOrFractionPattern,
			majorityVotersInclusive: {
				type: 'boolean'
			},
			majorityMustReachBoth: {
				type: 'boolean'
			},
			numChosenOptions: {
				type: 'integer',
				format: 'uint8',
				minimum: 1
			},
			mentionThreshold: oneNumberOrFractionPattern,
			mentionThresholdInclusive: {
				type: 'boolean'
			},
			maxOptionsPerBallot: {
				type: 'integer',
				format: 'uint8',
				minimum: 1,
				nullable: true
			},
			tieBreakerCodeholder: {
				type: 'integer',
				format: 'uint32'
			},
			publishVoters: {
				type: 'boolean'
			},
			publishVotersPercentage: {
				type: 'boolean'
			},
			publishResults: {
				type: 'boolean'
			},
			options: {
				type: 'array',
				minItems: 2,
				maxItems: 255,
				items: {
					oneOf: [
						{
							type: 'object',
							properties: {
								type: {
									type: 'string',
									const: 'codeholder'
								},
								codeholderId: {
									type: 'integer',
									format: 'uint32'
								},
								description: {
									type: 'string',
									minLength: 1,
									maxLength: 2000,
									nullable: true
								}
							},
							required: [ 'type', 'codeholderId' ],
							additionalProperties: false
						},
						{
							type: 'object',
							properties: {
								type: {
									type: 'string',
									const: 'simple'
								},
								name: {
									type: 'string',
									minLength: 1,
									maxLength: 100,
									pattern: '^[^\\n]+$'
								},
								description: {
									type: 'string',
									minLength: 1,
									maxLength: 2000,
									nullable: true
								}
							},
							required: [ 'type', 'name' ],
							additionalProperties: false
						}
					]
				}
			}
		},
		required: [
			'org',
			'name',
			'voterCodeholders',
			'timeStart',
			'timeEnd',
			'type'
		],
		additionalProperties: false
	};
};

const schemas = {
	'yn': getSchema('yn'),
	'ynb': getSchema('ynb'),
	'rp': getSchema('rp'),
	'stv': getSchema('stv'),
	'tm': getSchema('tm')
};
delete schemas.yn.properties.blankBallotsLimit;
delete schemas.yn.properties.blankBallotsLimitInclusive;
delete schemas.yn.properties.numChosenOptions;
delete schemas.yn.properties.mentionThreshold;
delete schemas.yn.properties.mentionThresholdInclusive;
delete schemas.yn.properties.maxOptionsPerBallot;
delete schemas.yn.properties.tieBreakerCodeholder;
delete schemas.yn.properties.options;

delete schemas.ynb.properties.numChosenOptions;
delete schemas.ynb.properties.mentionThreshold;
delete schemas.ynb.properties.mentionThresholdInclusive;
delete schemas.ynb.properties.maxOptionsPerBallot;
delete schemas.ynb.properties.tieBreakerCodeholder;
delete schemas.ynb.properties.options;

delete schemas.rp.properties.majorityBallots;
delete schemas.rp.properties.majorityBallotsInclusive;
delete schemas.rp.properties.majorityMustReachBoth;
delete schemas.rp.properties.maxOptionsPerBallot;
schemas.rp.required.push('options', 'tieBreakerCodeholder');

delete schemas.stv.properties.majorityBallots;
delete schemas.stv.properties.majorityBallotsInclusive;
delete schemas.stv.properties.majorityMustReachBoth;
delete schemas.stv.properties.mentionThreshold;
delete schemas.stv.properties.mentionThresholdInclusive;
delete schemas.stv.properties.maxOptionsPerBallot;
schemas.stv.required.push('options', 'tieBreakerCodeholder');

delete schemas.tm.properties.majorityBallots;
delete schemas.tm.properties.majorityBallotsInclusive;
delete schemas.tm.properties.majorityMustReachBoth;
delete schemas.tm.properties.majorityMustReachBoth;
delete schemas.tm.properties.tieBreakerCodeholder;
schemas.tm.required.push('options');

export const postSchema = {
	oneOf: Object.values(schemas).map(x => merge({}, x))
};

export const templateSchema = {
	oneOf: Object.values(schemas).map(oldSchema => {
		const newSchema = merge({}, oldSchema);
		delete newSchema.required;
		delete newSchema.properties.org;
		delete newSchema.properties.timeStart;
		delete newSchema.properties.timeEnd;
		return newSchema;
	})
};

const patchSchema = getSchema();
delete patchSchema.required;
patchSchema.minProperties = 1;
delete patchSchema.properties.org;
delete patchSchema.properties.type;
export { patchSchema };
