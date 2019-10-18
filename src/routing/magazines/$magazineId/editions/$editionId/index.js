import express from 'express';

import { bindMethod } from '../../../..';

import { init as route$files } from './files';
import { init as route$thumbnail } from './thumbnail';

import method$get from './get';
import method$delete from './delete';
import method$patch from './patch';

/**
 * Sets up /magazines/{magazineId}/editions/{editionId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/files', route$files());
	router.use('/thumbnail', route$thumbnail());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'delete', method$delete);
	bindMethod(router, '/', 'patch', method$patch);

	return router;
}
