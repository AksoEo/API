import express from 'express';

import { bindMethod } from '../../../..';

import { init as route$location_tags } from './location_tags';

import method$get from './get';
import method$delete from './delete';
import method$patch from './patch';

/**
 * Sets up /congresses/{congressId}/instances/{instanceId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/location_tags', route$location_tags());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'delete', method$delete);
	bindMethod(router, '/', 'patch', method$patch);

	return router;
}
