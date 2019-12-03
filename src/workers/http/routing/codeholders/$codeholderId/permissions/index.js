import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$permission } from './$permission';

import method$get from './get';

/**
 * Sets up /codeholders/{codeholderId}/permissions
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	const permissionRegex = /^(\w+(\.\w+)*(\.\*)?)|\*$/;
	router.param('permission', (req, res, next, val) => {
		if (permissionRegex.test(val) && val.length <= 255) { next(); }
		else { next('route'); }
	});
	router.use('/:permission', route$$permission());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
