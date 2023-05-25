export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		const magazine = await AKSO.db('magazines')
			.first('org', 'name')
			.where('id', req.params.magazineId);
		if (!magazine) { return res.sendStatus(404); }
		
		const orgPerm = 'magazines.read.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		const exists = await AKSO.db('magazines_editions_toc')
			.first(1)
			.leftJoin('magazines_editions_toc_recitations', 'magazines_editions_toc.id', 'magazines_editions_toc_recitations.tocEntryId')
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				id: req.params.tocEntryId,
				format: req.params.format,
			});
		if (!exists) { return res.sendStatus(404); }

		// Bump the download count
		await AKSO.db('magazines_editions_toc_recitations')
			.where({
				tocEntryId: req.params.tocEntryId,
				format: req.params.format
			})
			.update('downloads', AKSO.db.raw('downloads + 1'));

		res.sendStatus(204);
	}
};
