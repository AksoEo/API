import Stripe from 'stripe';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				codeholderId: {
					type: 'integer',
					format: 'uint32',
					nullable: true
				},
				customer: {
					type: 'object',
					properties: {
						email: {
							type: 'string',
							format: 'email',
							minLength: 1,
							maxLength: 250
						},
						name: {
							type: 'string',
							pattern: '^[^\\n]+$',
							minLength: 1,
							maxLength: 100
						}
					},
					minProperties: 1,
					additionalProperties: false
				},
				internalNotes: {
					type: 'string',
					minLength: 1,
					maxLength: 5000,
					nullable: true
				},
				customerNotes: {
					type: 'string',
					minLength: 1,
					maxLength: 5000,
					nullable: true
				},
				foreignId: {
					type: 'string',
					minLength: 1,
					maxLength: 500,
					nullable: true
				}
			},
			minProperties: 1,
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

		if (paymentIntent.status !== 'pending') { return res.sendStatus(409); }

		// Make sure the codeholder exists
		if ('codeholderId' in req.body && req.body.codeholderId !== null) {
			const codeholderExists = await AKSO.db('codeholders')
				.where('id', req.body.codeholderId)
				.first(1);
			if (!codeholderExists) {
				return res.type('text/plain').status(400).send('Codeholder not found');
			}
		}

		let stripeClient = null;
		if (paymentIntent.paymentMethod.type === 'stripe') {
			try {
				stripeClient = new Stripe(paymentIntent.stripeSecretKey, {
					apiVersion: AKSO.STRIPE_API_VERSION
				});
			} catch (e) {
				e.code = 500; // Stripe uses code instead of statusCode
				throw e;
			}

			if (req.body.customer) {
				try {
					// TODO: Improve error handling
					await stripeClient.paymentIntents.update(paymentIntent.stripePaymentIntentId, {
						receipt_email: req.body.customer.email
					});
				} catch (e) {
					e.code = 500; 
				}
			}
		}

		const data = {
			codeholderId: req.body.codeholderId,
			customer_email: req.body.customer.email,
			customer_name: req.body.customer.name,
			internalNotes: req.body.internalNotes,
			customerNotes: req.body.customerNotes,
			foreignId: req.body.foreignId
		};

		await AKSO.db('pay_intents')
			.where('id', req.params.paymentIntentId)
			.update(data);

		res.sendStatus(204);
	}
};
