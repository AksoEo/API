import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$snapshotId } from './$snapshotId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /magazines/{magazineId}/editions/{editionId}/paper_snapshots
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:snapshotId(\\d+)', route$$snapshotId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
