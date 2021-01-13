import express from 'express';

import { init as route$entries } from './entries';
import { init as route$options } from './options';

/**
 * Sets up /registration
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/entries', route$entries());
	router.use('/options', route$options());

	return router;
}
