import express from 'express';

import { bindMethod } from '..';

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

	router.use('/totp', route$totp());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'put', method$put);
	bindMethod(router, '/', 'delete', method$delete);

	return router;
}
