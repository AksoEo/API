import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import method$get from './get';
import method$put from './put';
import method$delete from './delete';

/**
 * Sets up /congresses/{congressId}/instances/{instanceId}/registration_form
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });
	
	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'put', method$put);
	bindMethod(router, '/', 'delete', method$delete);

	return router;
}
