import path from 'path';
import fs from 'fs-extra';

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
		
		const picDir = path.join(
			AKSO.conf.dataDir,
			'magazine_edition_thumbnails',
			req.params.magazineId,
			req.params.editionId
		);

		if (!await fs.exists(picDir)) { return res.sendStatus(404); }

		// Set the mime type
		const picData = await fs.readJson(path.join(picDir, 'pic.txt'));
		res.type(picData.mime);

		// Fetch the thumbnail
		res.sendFile(path.join(picDir, req.params.size.toString()));
	}
};
