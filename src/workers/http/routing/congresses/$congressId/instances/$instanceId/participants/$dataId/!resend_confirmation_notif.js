import { manualDataValidation, sendParticipantConfirmationNotif } from '../schema';

export default {
	schema: {
		query: null,
		body: null,
	},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const congressData = await AKSO.db('congresses')
			.innerJoin('congresses_instances', 'congressId', 'congresses.id')
			.where({
				congressId: req.params.congressId,
				'congresses_instances.id': req.params.instanceId
			})
			.first('org');
		if (!congressData) { return res.sendStatus(404); }
		if (!req.hasPermission('congress_instances.participants.update.' + congressData.org)) { return res.sendStatus(403); }

		// Make sure the form exists
		const formData = await AKSO.db('congresses_instances_registrationForm')
			.where('congressInstanceId', req.params.instanceId)
			.first('confirmationNotifTemplateId');
		if (!formData) { return res.sendStatus(404); }

		// Make sure the participant exists
		const participantExists = await AKSO.db('congresses_instances_participants')
			.where({
				'dataId': req.params.dataId,
				'congressInstanceId': req.params.instanceId,
			})
			.first(1);
		if (!participantExists) { return res.sendStatus(404); }

		if (!formData.confirmationNotifTemplateId) {
			return res.sendStatus(409);
		}

		await sendParticipantConfirmationNotif(req.params.instanceId, req.params.dataId, formData.confirmationNotifTemplateId);
		res.sendStatus(204);
	}
};
