import fs from 'fs-extra';
import path from 'path';
import tmp from 'tmp-promise';
import msgpack from 'msgpack-lite';
import moment from 'moment-timezone';

import QueryUtil from 'akso/lib/query-util';

import { schema as parSchema, memberFieldsManual } from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: {
			type: 'object',
			properties: {
				email: {
					type: 'string',
					format: 'email'
				},
				language: {
					type: 'string',
					enum: [
						'eo', 'en', 'fr', 'es',
						'nl', 'pt', 'sk', 'zh',
						'de'
					]
				},
				latin: {
					type: 'boolean',
					default: false
				},
				includeCode: {
					type: 'boolean',
					default: true
				},
				paper: {
					type: 'string',
					default: 'A4',
					enum: [ 'A3', 'A4', 'A5', 'LETTER', 'FOLIO', 'LEGAL', 'EXECUTIVE' ]
				},
				margins: {
					type: 'object',
					properties: {
						top: {
							type: 'number',
							format: 'uint16'
						},
						bottom: {
							type: 'number',
							format: 'uint16'
						},
						left: {
							type: 'number',
							format: 'uint16'
						},
						right: {
							type: 'number',
							format: 'uint16'
						}
					},
					required: [ 'top', 'bottom', 'left', 'right' ],
					additionalProperties: false,
					default: {
						top: 72,
						bottom: 72,
						left: 72,
						right: 72
					}
				},
				cols: {
					type: 'integer',
					minimum: 1,
					maximum: 20
				},
				rows: {
					type: 'integer',
					minimum: 1,
					maximum: 50
				},
				colGap: {
					type: 'number',
					format: 'uint16'
				},
				rowGap: {
					type: 'number',
					format: 'uint16'
				},
				cellPadding: {
					type: 'number',
					format: 'uint16',
					default: 8
				},
				fontSize: {
					type: 'integer',
					minimum: 8,
					maximum: 30,
					default: 12
				},
				drawOutline: {
					type: 'boolean',
					default: false
				}
			},
			required: [ 'language', 'cols', 'rows', 'colGap', 'rowGap' ],
			additionalProperties: false
		},
		requirePerms: 'codeholders.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		if ('limit' in req.query) {
			return res.status(400).type('text/plain').send('?limit is not allowed');
		}
		if ('offset' in req.query) {
			return res.status(400).type('text/plain').send('?offset is not allowed');
		}
		if ('fields' in req.query) {
			return res.status(400).type('text/plain').send('?fields is not allowed');
		}

		if (!req.body.email && (!req.user || !req.user.isUser())) {
			return res.status(400).type('text/plain').send('email may only be left out when using user auth');
		}

		// Restrictions
		const requiredMemberFields = [
			'id',
			'address.country',
			'address.countryArea',
			'address.city',
			'address.cityArea',
			'address.streetAddress',
			'address.postalCode',
			'address.sortingCode',
			'honorific',
			'firstNameLegal',
			'lastNameLegal',
			'fullName',
			'fullNameLocal',
			'careOf'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'r')) {
			return res.status(403).type('text/plain').send('Missing permitted address codeholder fields, check /perms');
		}

		let fieldWhitelist = null;
		if (req.memberFields) { fieldWhitelist = Object.keys(req.memberFields); }

		const query = AKSO.db('view_codeholders');
		// This throwns an error if the query is in any way invalid
		QueryUtil.simpleCollection(req, schema, query, fieldWhitelist);
		query.toSQL();

		const order = {
			memberFilter: req.memberFilter,
			body: req.body,
			query: req.query,
			user: req.user.isUser() ? req.user.user : null
		};

		const scheduleDir = path.join(AKSO.conf.stateDir, 'address_label_orders');
		const tmpName = await tmp.tmpName({ dir: scheduleDir, prefix: 'tmp-' });
		await fs.writeFile(tmpName, msgpack.encode(order, { codec: AKSO.msgpack }));
		const newName = await tmp.tmpName({ dir: scheduleDir, prefix: 'label-' + moment().unix() });
		await fs.move(tmpName, newName);

		res.sendStatus(202);
	}
};
