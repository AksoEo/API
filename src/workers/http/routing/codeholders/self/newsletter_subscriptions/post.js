import moment from 'moment-timezone';
import path from 'path';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				id: {
					type: 'integer',
					format: 'uint32',
				},
			},
			required: [
				'id'
			],
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		const subscriptionExists = await AKSO.db('newsletters_subscribers')
			.first(1)
			.where({
				newsletterId: req.body.id,
				codeholderId: req.user.user,
			});
		if (subscriptionExists) {
			return res.status(409).type('text/plain')
				.send('The codeholder is already subscribed to that newsletter');
		}

		const newsletter = await AKSO.db('newsletters')
			.first(1)
			.where({
				id: req.body.id,
				public: true,
			});
		if (!newsletter) {
			return res.status(400).type('text/plain')
				.send('Unknown or private newsletter');
		}

		await AKSO.db('newsletters_subscribers').insert({
			newsletterId: req.body.id,
			codeholderId: req.user.user,
			time: moment().unix(),
		});

		res.set('Location', path.join(AKSO.conf.http.path, 'codeholders/self/newsletter_subscriptions', req.body.id.toString()));
		res.set('X-Identifier', req.body.id.toString());
		res.sendStatus(201);
	}
};
