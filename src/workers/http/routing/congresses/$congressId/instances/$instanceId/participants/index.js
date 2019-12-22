import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import method$post from './post';

/**
 * Sets up /congresses/{congressId}/instances/{instanceId}/participants
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	bindMethod(router, '/', 'post', method$post);

	return router;
}
