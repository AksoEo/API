import express from 'express';

import { init as route$payment_orgs } from './payment_orgs';

/**
 * Sets up /aksopay
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/payment_orgs', route$payment_orgs());

	return router;
}
