export default {
	schema: {
		query: null,
		body: null,
	},

	run: async function run (req, res) {
		const pref = await AKSO.db('codeholders_notif_pref_global')
			.first('pref')
			.where('codeholderId', req.user.user);

		const prefArr = (pref?.pref ?? 'email')
			.split(',');

		res.sendObj({
			pref: prefArr
		});
	}
};
