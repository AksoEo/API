import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$notifTemplateId } from './$notifTemplateId';
import { init as route$domains } from './domains';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /notif_templates
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/domains', route$domains());
	router.use('/:notifTemplateId(\\d+)', route$$notifTemplateId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
