import { deleteObject } from 'akso/lib/s3';

export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		const magazine = await AKSO.db('magazines')
			.first('org')
			.where('id', req.params.magazineId);
		if (!magazine) { return res.sendStatus(404); }
		
		const orgPerm = 'magazines.recitations.delete.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		const tocEntry = await AKSO.db('magazines_editions_toc')
			.first('s3Id')
			.leftJoin('magazines_editions_toc_recitations', 'magazines_editions_toc.id', 'magazines_editions_toc_recitations.tocEntryId')
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				id: req.params.tocEntryId,
				format: req.params.format,
			});
		if (!tocEntry) { return res.sendStatus(404); }

		await deleteObject(tocEntry.s3Id);

		await AKSO.db('magazines_editions_toc_recitations')
			.where({
				tocEntryId: req.params.tocEntryId,
				format: req.params.format
			})
			.delete();	

		res.sendStatus(204);
	}
};
