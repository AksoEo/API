import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$recitation } from './recitation';

import method$get from './get';
import method$patch from './patch';
import method$delete from './delete';

/**
 * Sets up /magazines/{magazineId}/editions/{editionId}/toc/{tocEntryId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/recitation', route$recitation());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'patch', method$patch);
	bindMethod(router, '/', 'delete', method$delete);

	return router;
}
