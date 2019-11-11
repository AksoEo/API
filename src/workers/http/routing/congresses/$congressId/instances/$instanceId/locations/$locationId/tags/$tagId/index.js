import express from 'express';

import { bindMethod } from '../../../../../../../..';

import method$put from './put';

/**
 * Sets up /congresses/{congressId}/instances/{instanceId}/locations/{locationId}/tags/{tagId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	bindMethod(router, '/', 'put', method$put);

	return router;
}
