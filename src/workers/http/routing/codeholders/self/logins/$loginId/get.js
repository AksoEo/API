import QueryUtil from '../../../../../../../lib/query-util';
import CodeholderLoginResource from '../../../../../../../lib/resources/codeholder-login-resource';

import { memberFieldsManual } from '../../../schema';
import parSchema from '../../../$codeholderId/logins/schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Check member fields
		const requiredMemberFields = [
			'id',
			'logins'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'r', req.ownMemberFields)) {
			return res.status(403).type('text/plain').send('Missing permitted files codeholder fields, check /perms');
		}

		const query = AKSO.db('codeholders_logins')
			.where({
				id: req.params.loginId,
				codeholderId: req.user.user
			});
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		try {
			const obj = new CodeholderLoginResource(row);
			res.sendObj(obj);
		} catch (e) {
			if (e.simpleResourceError) { return res.sendStatus(404); }
			throw e;
		}
	}
};
