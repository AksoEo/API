import QueryUtil from '../../../../lib/query-util';
import CodeholderLoginResource from '../../../../lib/resources/codeholder-login-resource';

import { memberFieldsManual } from '../../schema';
import parSchema from '../../$codeholderId/logins/schema';

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
		// Check member fields
		const requiredMemberFields = [
			'id',
			'logins'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'r', req.ownMemberFields)) {
			return res.status(403).type('text/plain').send('Missing permitted files codeholder fields, check /perms');
		}

		const query = AKSO.db('codeholders_logins')
			.where('codeholderId', req.user.user);

		await QueryUtil.handleCollection({ req, res, schema, query, Res: CodeholderLoginResource });
	}
};
