import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import method$get from './get';
import method$delete from './delete';
import method$put from './put';

import operation$bump from './!bump';

/**
 * Sets up /magazines/{magazineId}/editions/{editionId}/toc/{tocEntryId}/recitation/{format}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'delete', method$delete);
	bindMethod(router, '/', 'put', method$put);

	bindMethod(router, '/!bump', 'post', operation$bump);

	return router;
}
