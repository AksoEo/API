import express from 'express';

import { bindMethod } from '..';

import { init as route$$codeholderId } from './$codeholderId';
import { init as route$$codeholderIds } from './$codeholderIds';

import method$get from './get';

/**
 * Sets up /codeholders
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:codeholderId(\\d+)', route$$codeholderId());
	router.use('/:codeholderIds(\\d+(,\\d+){0,99})', route$$codeholderIds());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
