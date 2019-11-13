import { schema as codeholderSchema, memberFilter, memberFieldsManual } from 'akso/workers/http/routing/codeholders/schema';
import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: null,
		body: null,
		requirePerms: [
			'codeholders.update',
			'codeholder_roles.read'
		]
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Check member fields
		const requiredMemberFields = [
			'roles'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'w')) {
			return res.status(403).type('text/plain').send('Missing permitted files codeholder fields, check /perms');
		}

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(codeholderSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		const deleted = await AKSO.db('codeholderRoles_codeholders')
			.where({
				'codeholderRoles_codeholders.id': req.params.roleEntryId,
				'codeholderId': req.params.codeholderId
			})
			.delete();

		if (deleted) { res.sendStatus(204); }
		else { res.sendStatus(404); }
	}
};
