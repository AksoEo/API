import express from 'express';

import { init as route$subjects } from './subjects';

/**
 * Sets up /delegations
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/subjects', route$subjects());

	return router;
}
