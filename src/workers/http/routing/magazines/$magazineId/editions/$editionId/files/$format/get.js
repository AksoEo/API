import path from 'path';
import fs from 'pn/fs';

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
		
		const orgPerm = 'magazines.read.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		const file = path.join(
			AKSO.conf.dataDir,
			'magazine_edition_files',
			`${req.params.magazineId}-${req.params.editionId}.${req.params.format}`
		);
		if (!await fs.exists(file)) { return res.sendStatus(404); }
		res.sendFile(file);

		if (req.method === 'HEAD') { return; }

		// Bump the download count
		await AKSO.db('magazines_editions_files')
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				format: req.params.format
			})
			.update('downloads', AKSO.db.raw('downloads + 1'));
	}
};
