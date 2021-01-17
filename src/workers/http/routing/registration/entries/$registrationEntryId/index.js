import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import method$get from './get';
import method$patch from './patch';
import method$delete from './delete';
import operation$cancel from './!cancel';

/**
 * Sets up /registration/entries/{registrationEntryId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'patch', method$patch);
	bindMethod(router, '/', 'delete', method$delete);
	bindMethod(router, '/!cancel', 'post', operation$cancel);

	return router;
}
