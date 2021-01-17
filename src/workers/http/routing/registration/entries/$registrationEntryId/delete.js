export default {
	schema: {
		requirePerms: 'registration.entries.delete'
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('registration_entries')
			.where('id', req.params.registrationEntryId)
			.delete();

		res.sendStatus(deleted ? 204 : 404);
	}
};
