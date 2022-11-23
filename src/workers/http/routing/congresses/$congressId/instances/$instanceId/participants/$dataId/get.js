import QueryUtil from 'akso/lib/query-util';
import CongressParticipantResource from 'akso/lib/resources/congress-participant-resource';

import { getFormMetaData, schema, afterQuery } from '../schema';

export default {
	schema: async req => (await getFormMetaData(req.params.instanceId)).schema,

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

		const formMetaData = await getFormMetaData(req.params.instanceId);

		formMetaData.query.where('view_congresses_instances_participants.dataId', req.params.dataId);
		QueryUtil.simpleResource(req, formMetaData.schema, formMetaData.query);

		const row = await formMetaData.query;
		if (!row) { return res.sendStatus(404); }
		await new Promise(resolve => afterQuery([row], resolve));
		const obj = new CongressParticipantResource(row, req, schema, formMetaData.formFieldsObj);

		res.sendObj(obj);
	}
};
