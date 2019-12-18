import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$emailTemplateId } from './$emailTemplateId';
import { init as route$domains } from './domains';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /email_templates
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/domains', route$domains());
	router.use('/:emailTemplateId(\\d+)', route$$emailTemplateId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
