import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import method$post from './post';
import method$delete from './delete';

/**
 * Sets up /auth/totp
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	bindMethod(router, '/', 'post', method$post);
	bindMethod(router, '/', 'delete', method$delete);

	return router;
}
