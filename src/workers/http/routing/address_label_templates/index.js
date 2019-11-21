import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$templateId } from './$templateId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /address_label_templates
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:templateId(\\d+)', route$$templateId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
