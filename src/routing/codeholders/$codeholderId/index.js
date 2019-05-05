import express from 'express';

import { bindMethod } from '../..';

import { init as route$files } from './files';

import method$get from './get';
import method$delete from './delete';

/**
 * Sets up /codeholders/{codeholderId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/files', route$files());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'delete', method$delete);

	return router;
}
