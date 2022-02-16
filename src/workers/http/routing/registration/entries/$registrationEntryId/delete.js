export default {
	schema: {
		requirePerms: [
			'codeholders.read',
		],
	},

	run: async function run (req, res) {
		// Make sure the registration entry exists
		const registrationEntry = await AKSO.db('registration_entries')
			.where('id', req.params.registrationEntryId)
			.first('intermediary');
		if (!registrationEntry) {
			return res.sendStatus(404);
		}

		// Check perms
		if (!req.hasPermission('registration.entries.delete') &&
			!req.hasPermission(`registration.entries.intermediary.${registrationEntry.intermediary}`)) {
			return res.sendStatus(403);
		}

		await AKSO.db('registration_entries')
			.where('id', req.params.registrationEntryId)
			.delete();

		res.sendStatus(204);
	}
};
