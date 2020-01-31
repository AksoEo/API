export default {
	schema: {
		requirePerms: [
			'clients.read', 'clients.perms.read'
		]
	},

	run: async function run (req, res) {
		const apiKey = Buffer.from(req.params.apiKey, 'hex');

		const memberRestrictions = await AKSO.db('admin_permissions_memberRestrictions_clients')
			.first('filter', 'fields')
			.where('apiKey', apiKey);

		if (!memberRestrictions) { return res.sendStatus(404); }

		res.sendObj(memberRestrictions);
	}
};
