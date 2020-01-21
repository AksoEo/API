import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$dataId } from './$dataId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /congresses/{congressId}/instances/{instanceId}/participants
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.param('dataId', (req, res, next, val) => {
		req.params.dataId = Buffer.from(val, 'hex');
		if (req.params.dataId.length) { next(); }
		else { next('route'); }
	});
	router.use('/:dataId', route$$dataId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
