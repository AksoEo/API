import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: null,
		body: null,
		requirePerms: 'codeholder_roles.delete'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const deleted = await AKSO.db('codeholderRoles')
			.where('id', req.params.roleId)
			.delete();

		if (deleted) { res.sendStatus(204); }
		else { res.sendStatus(404); }
	}
};
