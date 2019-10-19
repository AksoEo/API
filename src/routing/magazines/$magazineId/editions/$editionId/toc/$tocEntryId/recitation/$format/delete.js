import fs from 'pn/fs';
import path from 'path';

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

		const deleted = await AKSO.db('magazines_editions_toc_recitations')
			.where({
				tocEntryId: req.params.tocEntryId,
				format: req.params.format
			})
			.delete();

		if (!deleted) { return res.sendStatus(404); }

		const file = path.join(
			AKSO.conf.dataDir,
			'magazine_edition_toc_recitation',
			`${req.params.tocEntryId}.${req.params.format}`
		);
		await fs.unlink(file);
		res.sendStatus(204);
	}
};
