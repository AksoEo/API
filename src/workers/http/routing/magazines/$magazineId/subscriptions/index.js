import express from 'express';
import { base32 } from 'rfc4648';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$subscriptionId } from './$subscriptionId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /magazines/{magazineId}/subscriptions
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.param('subscriptionId', (req, res, next, val) => {
		try {
			req.params.subscriptionId = base32.parse(val, { out: Buffer.allocUnsafe, loose: true });
		} catch {
			return next('route');
		}
		next();
	});
	router.use('/:subscriptionId', route$$subscriptionId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
