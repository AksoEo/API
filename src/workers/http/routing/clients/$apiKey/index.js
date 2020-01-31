import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$member_restrictions } from './member_restrictions';
import { init as route$permissions } from './permissions';

import method$get from './get';
import method$patch from './patch';
import method$delete from './delete';

import operation$create_new_secret from './!create_new_secret';

/**
 * Sets up /clients/{apiKey}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/member_restrictions', route$member_restrictions());
	router.use('/permissions', route$permissions());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'patch', method$patch);
	bindMethod(router, '/', 'delete', method$delete);

	bindMethod(router, '/!create_new_secret', 'post', operation$create_new_secret);

	return router;
}
