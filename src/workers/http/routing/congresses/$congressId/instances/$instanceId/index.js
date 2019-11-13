import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$location_tags } from './location_tags';
import { init as route$locations } from './locations';
import { init as route$map } from './map';
import { init as route$program_tags } from './program_tags';
import { init as route$programs } from './programs';

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
	router.use('/locations', route$locations());
	router.use('/map', route$map());
	router.use('/program_tags', route$program_tags());
	router.use('/programs', route$programs());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'delete', method$delete);
	bindMethod(router, '/', 'patch', method$patch);

	return router;
}
