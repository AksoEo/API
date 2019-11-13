import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import method$get from './get';
import method$delete from './delete';

/**
 * Sets up /codeholders/{codeholderId}/files/{fileId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });
	
	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'delete', method$delete);

	return router;
}
