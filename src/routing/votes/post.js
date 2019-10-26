import path from 'path';
import moment from 'moment-timezone';

import QueryUtil from '../../lib/query-util';
import AKSOOrganization from '../../lib/enums/akso-organization';

import { schema as codeholderSchema } from '../codeholders/schema';

const oneNumberOrFractionPattern = {
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
const oneNumberOrFractionToStr = function (num) {
	if (typeof num === 'number') { return num.toString(); }
	else { return num.join('/'); }
};

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
				format: 'uint32',
				nullable: true
			},
			publishVoters: {
				type: 'boolean'
			},
			publishVotersPercentage: {
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
schemas.rp.required.push('options');

delete schemas.stv.properties.majorityBallots;
delete schemas.stv.properties.majorityBallotsInclusive;
delete schemas.stv.properties.majorityMustReachBoth;
delete schemas.stv.properties.mentionThreshold;
delete schemas.stv.properties.mentionThresholdInclusive;
delete schemas.stv.properties.maxOptionsPerBallot;
schemas.stv.required.push('options');

delete schemas.tm.properties.majorityBallots;
delete schemas.tm.properties.majorityBallotsInclusive;
delete schemas.tm.properties.majorityMustReachBoth;
delete schemas.tm.properties.majorityMustReachBothtieBreakerCodeholder;
schemas.tm.required.push('options');

export default {
	schema: {
		query: null,
		body: {
			oneOf: Object.values(schemas)
		}
	},

	run: async function run (req, res) {
		const orgPerm = 'votes.create.' + req.body.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		// Manual data validation and trickery
		req.body.voterCodeholders = { $and: [ req.memberFilter, req.body.voterCodeholders ] };
		if (req.body.viewerCodeholders) {
			req.body.viewerCodeholders = { $and: [ req.memberFilter, req.body.viewerCodeholders ] };
		}
		try {
			const validateFilter = { $or: [ req.body.voterCodeholders ] };
			if (req.body.viewerCodeholders) { validateFilter.$or.push(req.body.viewerCodeholders); }
			const query = AKSO.db('view_codeholders');
			QueryUtil.filter({
				fields: Object.keys(codeholderSchema.fields)
					.filter(x => codeholderSchema.fields[x].indexOf('f' > -1)),
				fieldAliases: codeholderSchema.fieldAliases,
				fieldWhitelist: req.memberFields,
				customCompOps: codeholderSchema.customFilterCompOps,
				customLogicOps: codeholderSchema.customFilterLogicOps,
				query,
				filter: validateFilter
			});
			await query;
		} catch (e) {
			return res.status(400).type('text/plain').send('Invalid voterCodeholders or viewerCodeholders');
		}
		req.body.voterCodeholders = JSON.stringify(req.body.voterCodeholders);
		if (req.body.viewerCodeholders) {
			req.body.viewerCodeholders = JSON.stringify(req.body.viewerCodeholders);
		}
		
		if (req.body.timeStart < moment().unix()) {
			return res.status(400).type('text/plain').send('timeStart must not be lower than the current unix time');
		}
		if (req.body.timeEnd < req.body.timeStart) {
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

		if ('numChosenOptions' in req.body) {
			if (req.body.numChosenOptions > req.body.options.length) {
				return res.status(400).type('text/plain').send('numChosenOptions must not be greater than the amount of options');
			}
		}
		if ('maxOptionsPerBallot' in req.body) {
			if (req.body.maxOptionsPerBallot > req.body.options.length) {
				return res.status(400).type('text/plain').send('maxOptionsPerBallot must not be greater than the amount of options');
			}
		}
		if ('tieBreakerCodeholder' in req.body) {
			const exists = await AKSO.db('codeholders')
				.first(1)
				.where(req.memberFilter)
				.where('id', req.body.tieBreakerCodeholder);
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

		const id = (await AKSO.db('votes').insert(req.body))[0];

		res.set('Location', path.join(AKSO.conf.http.path, '/votes/', id.toString()));
		res.sendStatus(201);
	}
};
