import express from 'express';

import { bindMethod } from '../..';

import operation$create_password from './!create_password';

/**
 * Sets up /codeholders/{email}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	bindMethod(router, '/!create_password', 'post', operation$create_password);

	return router;
}
