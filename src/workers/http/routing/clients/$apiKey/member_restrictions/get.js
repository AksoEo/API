export default {
	schema: {
		requirePerms: [
			'clients.read', 'clients.perms.read'
		]
	},

	run: async function run (req, res) {
		const memberRestrictions = await AKSO.db('admin_permissions_memberRestrictions_clients')
			.first('filter', 'fields')
			.where('apiKey', req.params.apiKey);

		if (!memberRestrictions) { return res.sendStatus(404); }

		res.sendObj(memberRestrictions);
	}
};
