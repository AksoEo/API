import express from 'express';

import { bindMethod } from '..';

import { init as route$$login } from './$login';
import { init as route$$codeholderId } from './$codeholderId';
import { init as route$$codeholderIds } from './$codeholderIds';
import { init as route$self } from './self';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /codeholders
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/self', route$self());
	router.use('/:codeholderId(\\d+)', route$$codeholderId());

	const codeholderIdsRegex = /^\d+(,\d+){0,99}$/;
	router.param('codeholderIds', (req, res, next, val) => {
		if (codeholderIdsRegex.test(val)) { next(); }
		else { next('route'); }
	});
	router.use('/:codeholderIds', route$$codeholderIds());

	const loginRegex = /^([^@]+@[^@]+|[a-z]{4}([a-z]{2})?)$/;
	router.param('login', (req, res, next, val) => {
		if (loginRegex.test(val)) { next(); }
		else { next('route'); }
	});
	router.use('/:login', route$$login());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
