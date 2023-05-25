import { deleteObjects } from 'akso/lib/s3';

export default {
	schema: {},

	run: async function run (req, res) {
		const magazine = await AKSO.db('magazines')
			.first('org')
			.where('id', req.params.magazineId);
		if (!magazine) { return res.sendStatus(404); }
		
		const orgPerm = 'magazines.update.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		const exists = await AKSO.db('magazines_editions_toc')
			.first(1)
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				id: req.params.tocEntryId,
			});
		if (!exists) { return res.sendStatus(404); }

		const s3Ids = await AKSO.db('magazines_editions_toc_recitations')
			.pluck('s3Id')
			.where({
				tocEntryId: req.params.tocEntryId,
			});

		if (s3Ids.length) {
			await deleteObjects({ keys: s3Ids });
		}

		await AKSO.db('magazines_editions_toc')
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				id: req.params.tocEntryId
			})
			.delete();

		res.sendStatus(204);
	}
};
