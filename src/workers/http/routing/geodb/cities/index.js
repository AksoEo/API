import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$cityId } from './$cityId';

import method$get from './get';

/**
 * Sets up /geodb/cities
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.param('cityId', (req, res, next, val) => {
		if (val[0] !== 'Q') { return next('route'); }
		const int = parseInt(val.substring(1), 10);
		if (isNaN(int)) { return next('route'); }
		req.params.cityId = int;
		next();
	});
	router.use('/:cityId', route$$cityId());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
