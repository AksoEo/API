import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$exchange_rates } from './exchange_rates';
import { init as route$payment_orgs } from './payment_orgs';
import { init as route$payment_intents } from './payment_intents';

import endpoint$stripe_webhook_handler from './stripe_webhook_handler';

/**
 * Sets up /aksopay
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/payment_orgs', route$payment_orgs());
	router.use('/payment_intents', route$payment_intents());
	router.use('/exchange_rates', route$exchange_rates());

	bindMethod(router, '/stripe_webhook_handler', 'post', endpoint$stripe_webhook_handler);

	return router;
}
