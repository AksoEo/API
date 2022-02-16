import moment from 'moment-timezone';

export default {
	schema: {
		requirePerms: [
			'registration.entries.update',
			'codeholders.read',
		],
	},

	run: async function run (req, res) {
		const registrationEntry = await AKSO.db('registration_entries')
			.where('id', req.params.registrationEntryId)
			.first('status');
		if (!registrationEntry) { return res.sendStatus(404); }
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
