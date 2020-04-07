import express from 'express';
import { base32 } from 'rfc4648';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$paymentIntentId } from './$paymentIntentId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /aksopay/payment_intents
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.param('paymentIntentId', (req, res, next, val) => {
		req.params.paymentIntentId = base32.parse(val, { out: Buffer.allocUnsafe, loose: true });
		next();
	});
	router.use('/:paymentIntentId', route$$paymentIntentId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
