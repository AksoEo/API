import moment from 'moment-timezone';

export default {
	schema: {
		requirePerms: [
			'codeholders.read',
		],
	},

	run: async function run (req, res) {
		const registrationEntry = await AKSO.db('registration_entries')
			.where('id', req.params.registrationEntryId)
			.first('status', 'intermediary');
		if (!registrationEntry) { return res.sendStatus(404); }

		// Check perms
		if (!req.hasPermission('registration.entries.delete') &&
			!req.hasPermission(`registration.entries.intermediary.${registrationEntry.intermediary}`)) {
			return res.sendStatus(403);
		}

		// Check status
		if (!(['submitted', 'pending'].includes(registrationEntry.status))) {
			return res.status(400).type('text/plain')
				.send('You can only cancel submitted or pending registration entries');
		}

		await AKSO.db('registration_entries')
			.where('id', req.params.registrationEntryId)
			.update({
				status: 'canceled',
				timeStatus: moment().unix()
			});

		res.sendStatus(204);
	}
};
