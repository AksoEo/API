import path from 'path';
import fs from 'fs-extra';

export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		const congress = await AKSO.db('congresses')
			.first('org')
			.where('id', req.params.congressId);
		if (!congress) { return res.sendStatus(404); }
		
		const orgPerm = 'congresses.delete.' + congress.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		await AKSO.db('congresses')
			.where('id', req.params.congressId)
			.delete();

		const dataPath = path.join(
			AKSO.conf.dataDir,
			'congress_instance_location_thumbnails',
			req.params.congressId
		);
		await fs.remove(dataPath);

		res.sendStatus(204);
	}
};
