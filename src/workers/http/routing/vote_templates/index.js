import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$voteTemplateId } from './$voteTemplateId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /vote_templates
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:voteTemplateId(\\d+)', route$$voteTemplateId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
