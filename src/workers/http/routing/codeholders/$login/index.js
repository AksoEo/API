import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import operation$create_password from './!create_password';
import operation$create_password_use from './!create_password_use';
import operation$forgot_password from './!forgot_password';

/**
 * Sets up /codeholders/{login}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	bindMethod(router, '/!create_password', 'post', operation$create_password);
	bindMethod(router, '/!create_password_use', 'post', operation$create_password_use);
	bindMethod(router, '/!forgot_password', 'post', operation$forgot_password);

	return router;
}
