import express from 'express';

import { init as route$applications } from './applications';
import { init as route$subjects } from './subjects';
import { init as route$delegates } from './delegates';

/**
 * Sets up /delegations
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/applications', route$applications());
	router.use('/subjects', route$subjects());
	router.use('/delegates', route$delegates());

	return router;
}
