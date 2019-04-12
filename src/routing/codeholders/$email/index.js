import express from 'express';

import { bindMethod } from '../..';

import operation$create_password from './!create_password';
import operation$create_password_use from './!create_password_use';

/**
 * Sets up /codeholders/{email}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	bindMethod(router, '/!create_password', 'post', operation$create_password);
	bindMethod(router, '/!create_password_use', 'post', operation$create_password_use);

	return router;
}
