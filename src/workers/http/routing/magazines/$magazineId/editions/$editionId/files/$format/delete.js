import path from 'path';

import { removePathAndEmptyParents } from 'akso/lib/file-util';

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
		
		const orgPerm = 'magazines.files.delete.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		const deleted = await AKSO.db('magazines_editions_files')
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				format: req.params.format
			})
			.delete();

		if (!deleted) { return res.sendStatus(404); }

		const parPath = path.join(
			AKSO.conf.dataDir,
			'magazine_edition_files',
			req.params.magazineId
		);
		const formatPath = path.join(
			parPath,
			req.params.editionId,
			req.params.format
		);
		await removePathAndEmptyParents(parPath, formatPath);

		res.sendStatus(204);
	}
};
