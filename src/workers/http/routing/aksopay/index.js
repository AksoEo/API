import express from 'express';

import { init as route$payment_orgs } from './payment_orgs';
import { init as route$payment_intents } from './payment_intents';

/**
 * Sets up /aksopay
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/payment_orgs', route$payment_orgs());
	router.use('/payment_intents', route$payment_intents());

	return router;
}
