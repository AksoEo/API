import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import method$get from './get';

/**
 * Sets up /magazines/{magazineId}/editions/{editionId}/paper_snapshots/{snapshotId}/codeholders
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	bindMethod(router, '/', 'get', method$get);

	return router;
}
