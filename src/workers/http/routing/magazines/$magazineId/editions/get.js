import QueryUtil from 'akso/lib/query-util';
import MagazineEditionResource from 'akso/lib/resources/magazine-edition-resource';
import AKSOOrganization from 'akso/lib/enums/akso-organization';

import { schema as parSchema, afterQuery } from './schema';

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

		// Make sure the magazine exists
		const magazineExists = await AKSO.db('magazines')
			.first(1)
			.where('id', req.params.magazineId)
			.whereIn('org', magazineOrgs);
		if (!magazineExists) { return res.sendStatus(404); }

		const query = AKSO.db('magazines_editions')
			.where('magazineId', req.params.magazineId);
		await QueryUtil.handleCollection({
			req, res, schema, query,
			Res: MagazineEditionResource,
			passToCol: [[ req, schema ]],
			afterQuery
		});
	}
};
