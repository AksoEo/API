import QueryUtil from 'akso/lib/query-util';
import CongressParticipantResource from 'akso/lib/resources/congress-participant-resource';

import { getFormMetaData, schema } from './schema';

export default {
	schema: async (req, res) => (await getFormMetaData(req, res)).schema,

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const orgData = await AKSO.db('congresses')
			.innerJoin('congresses_instances', 'congressId', 'congresses.id')
			.where({
				congressId: req.params.congressId,
				'congresses_instances.id': req.params.instanceId
			})
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('congress_instances.participants.read.' + orgData.org)) { return res.sendStatus(403); }

		const formMetaData = await getFormMetaData(req, res);

		await QueryUtil.handleCollection({
			req, res, schema: formMetaData.schema, query: formMetaData.query,
			Res: CongressParticipantResource, passToCol: [[ req, schema, formMetaData.formFieldsObj ]]
		});
	}
};
