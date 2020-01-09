export default {
	schema: {},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const orgData = await AKSO.db('notif_templates')
			.where('id', req.params.notifTemplateId)
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('notif_templates.delete.' + orgData.org)) { return res.sendStatus(403); }

		await AKSO.db('notif_templates')
			.where('id', req.params.notifTemplateId)
			.delete();

		res.sendStatus(204);
	}
};
