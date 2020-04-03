import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$paymentOrgId } from './$paymentOrgId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /aksopay/payment_orgs
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:paymentOrgId(\\d+)', route$$paymentOrgId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
