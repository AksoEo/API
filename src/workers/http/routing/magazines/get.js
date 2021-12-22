import QueryUtil from 'akso/lib/query-util';
import MagazineResource from 'akso/lib/resources/magazine-resource';
import AKSOOrganization from 'akso/lib/enums/akso-organization';

import { schema as parSchema } from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const magazineOrgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('magazines.read.' + org));
		if (!magazineOrgs.length) {
			res.type('text/plain').status(400)
				.send('Missing perm magazines.read.<org>');
		}

		const query = AKSO.db('magazines')
			.whereIn('org', magazineOrgs);
		await QueryUtil.handleCollection({
			req, res, schema, query,
			Res: MagazineResource, passToCol: [[req, parSchema]]
		});
	}
};
