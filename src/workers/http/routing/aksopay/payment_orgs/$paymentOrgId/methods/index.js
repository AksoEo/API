import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$paymentMethodId } from './$paymentMethodId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /aksopay/payment_orgs/{paymentOrgId}/methods
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:paymentMethodId(\\d+)', route$$paymentMethodId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
