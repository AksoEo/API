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
		
		const orgPerm = 'magazines.files.delete.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		// Find the file
		const file = await AKSO.db('magazines_editions_files')
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				format: req.params.format
			})
			.first('s3Id');
		if (!file) {
			return res.sendStatus(404);
		}

		// Delete the file from s3
		await deleteObject(file.s3Id);

		// Delete from db
		await AKSO.db('magazines_editions_files')
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				format: req.params.format
			})
			.delete();

		res.sendStatus(204);
	}
};
