import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$size } from './$size';

import method$put from './put';
import method$delete from './delete';

/**
 * Sets up /codeholders/{codeholderId}/profile_pictre
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:size(\\d+px)', route$$size());

	bindMethod(router, '/', 'put', method$put);
	bindMethod(router, '/', 'delete', method$delete);

	return router;
}
