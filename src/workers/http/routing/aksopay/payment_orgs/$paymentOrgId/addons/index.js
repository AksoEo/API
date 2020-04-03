import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$paymentAddonId } from './$paymentAddonId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /aksopay/payment_orgs/{paymentOrgId}/addons
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:paymentAddonId(\\d+)', route$$paymentAddonId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
