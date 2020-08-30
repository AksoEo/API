export default {
	schema: {
		body: {
			type: 'object',
			properties: {
				purposeIndex: {
					type: 'number',
					format: 'uint16'
				},
				invalid: {
					type: 'boolean'
				}
			},
			required: [
				'purposeIndex', 'invalid'
			],
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const paymentIntent = await AKSO.db('pay_intents')
			.where('id', req.params.paymentIntentId)
			.first('*');
		if (!paymentIntent) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_intents.update.' + paymentIntent.org)) { return res.sendStatus(403); }

		const validitySet = await AKSO.db('pay_intents_purposes')
			.where({
				paymentIntentId: req.params.paymentIntentId,
				pos: req.body.purposeIndex
			})
			.update('invalid', req.body.invalid);

		res.sendStatus(validitySet ? 204 : 404);
	}
};
