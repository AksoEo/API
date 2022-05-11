import path from 'path';
import moment from 'moment-timezone';

import QueryUtil from 'akso/lib/query-util';
import MagazineResource from 'akso/lib/resources/magazine-resource';
import MagazineEditionResource from 'akso/lib/resources/magazine-edition-resource';

import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					nullable: true,
					minLength: 1,
					maxLength: 255,
					pattern: '^[^\\n]+$'
				}
			},
			additionalProperties: false
		},
		requirePerms: 'codeholders.read'
	},

	run: async function run (req, res) {
		// Make sure the magazine edition exists
		const magazineExists = await AKSO.db('magazines_editions')
			.first(1)
			.where({
				magazineId: req.params.magazineId,
				id: req.params.editionId
			});
		if (!magazineExists) { return res.sendStatus(404); }

		// Check perms
		const magazine = await AKSO.db('magazines')
			.first('org')
			.where('id', req.params.magazineId);
		if (!magazine) { return res.sendStatus(404); }
		
		const orgPerm = 'magazines.snapshots.create.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		const data = {
			...req.body,
			...{
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				time: moment().unix()
			}
		};

		const trx = await req.createTransaction();

		// Create the snapshot
		const id = (await trx('magazines_paperAccessSnapshots').insert(data))[0];

		// Obtain the filter
		const editionResource = new MagazineEditionResource(
			await trx('magazines_editions')
				.first('id', 'magazineId', 'subscribers')
				.where('id', req.params.editionId),

			{ query: { fields: [ 'subscriberFiltersCompiled' ] } }
		).obj;
		const magazineResource = new MagazineResource(
			await trx('magazines')
				.first('id', 'subscribers')
				.where('id', req.params.magazineId),

			{ query: { fields: [ 'subscriberFiltersCompiled' ] } }
		).obj;

		let filter = false;
		if (
			editionResource.subscriberFiltersCompiled &&
			editionResource.subscriberFiltersCompiled.paper
		) {
			filter = editionResource.subscriberFiltersCompiled.paper;
		} else if (magazineResource.subscriberFiltersCompiled.paper) {
			filter = magazineResource.subscriberFiltersCompiled.paper;
		}

		if (filter) {
			// Add codeholders to the snapshot
			const subQuery = AKSO.db.select('id AS codeholderId', trx.raw('? AS `snapshotId`', id))
				.from('view_codeholders');
			QueryUtil.filter({
				filter,
				query: subQuery,
				fields: codeholderSchema.fields,
				fieldAliases: codeholderSchema.fieldAliases,
				customCompOps: codeholderSchema.customFilterCompOps,
				customLogicOpsFields: codeholderSchema.customFilterLogicOpsFields,
				customLogicOps: codeholderSchema.customFilterLogicOps,
			});
			memberFilter(codeholderSchema, subQuery, req);
			await trx.raw(
				'INSERT INTO magazines_paperAccessSnapshots_codeholders (codeholderId, snapshotId) ' + subQuery
			);
		}

		await trx.commit();

		res.set('Location', path.join(
			AKSO.conf.http.path,
			'magazines',
			req.params.magazineId,
			'editions',
			id.toString()
		));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
