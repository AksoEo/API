import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$format } from './$format';

import method$get from './get';

/**
 * Sets up /magazines/{magazineId}/editions/{editionId}/files
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:format(pdf|epub)', route$$format());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
