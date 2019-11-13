import express from 'express';
import slowDown from 'express-slow-down';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$totp } from './totp';

import method$get from './get';
import method$put from './put';
import method$delete from './delete';

/**
 * Sets up /auth
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();
	router.use(slowDown({
		windowMs: AKSO.SLOW_DOWN_WINDOW_MS,
		delayAfter: AKSO.SLOW_DOWN_DELAY_AFTER,
		delayMs: AKSO.SLOW_DOWN_DELAY_MS,
		maxDelayMs: AKSO.SLOW_DOWN_MAX_DELAY_MS,
		skipSuccessfulRequests: true
	}));

	router.use('/totp', route$totp());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'put', method$put);
	bindMethod(router, '/', 'delete', method$delete);

	return router;
}
