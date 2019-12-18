export default {
	schema: {},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const orgData = await AKSO.db('email_templates')
			.where('id', req.params.emailTemplateId)
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('email_templates.delete.' + orgData.org)) { return res.sendStatus(403); }

		await AKSO.db('email_templates')
			.where('id', req.params.emailTemplateId)
			.delete();

		res.sendStatus(204);
	}
};
