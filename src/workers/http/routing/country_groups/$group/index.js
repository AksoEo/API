import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$countries } from './countries';

import method$get from './get';
import method$patch from './patch';
import method$delete from './delete';

/**
 * Sets up /country_groups/{group}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/countries', route$countries());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'patch', method$patch);
	bindMethod(router, '/', 'delete', method$delete);

	return router;
}
