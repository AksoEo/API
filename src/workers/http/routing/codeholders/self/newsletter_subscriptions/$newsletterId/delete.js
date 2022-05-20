import moment from 'moment-timezone';

export default {
	schema: {
		body: {
			type: 'object',
			properties: {
				reason: {
					type: 'integer',
					format: 'uint8',
					maximum: 4,
					default: 0,
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 400,
					nullable: true,
				},
			},
			additionalProperties: false,
		}
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('newsletters_subscribers')
			.where({
				codeholderId: req.user.user,
				newsletterId: req.params.newsletterId,
			})
			.delete();

		res.sendStatus(deleted ? 204 : 404);

		if (!deleted) { return; }

		const subscriberCount = (await AKSO.db('newsletters_subscribers')
			.count({ count: 1 })
			.where('newsletterId', req.params.newsletterId))[0].count;

		await AKSO.db('newsletters_unsubscriptions')
			.insert({
				newsletterId: req.params.newsletterId,
				reason: req.body.reason,
				description: req.body.description,
				time: moment().unix(),
				subscriberCount,
			});
	}
};
