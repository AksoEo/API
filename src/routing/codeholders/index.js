import express from 'express';

import { bindMethod } from '..';

import { init as route$$codeholderId } from './$codeholderId';

import method$get from './get';

/**
 * Sets up /codeholders
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:codeholderId(\\d+)', route$$codeholderId());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
