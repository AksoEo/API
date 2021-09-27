import express from 'express';

import { init as route$cities } from './cities';

/**
 * Sets up /geodb
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/cities', route$cities());

	return router;
}
