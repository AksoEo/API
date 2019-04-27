import express from 'express';

import { bindMethod } from '..';

import { init as route$$login } from './$login';
import { init as route$$codeholderId } from './$codeholderId';
import { init as route$$codeholderIds } from './$codeholderIds';

import method$get from './get';

/**
 * Sets up /codeholders
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	const loginRegex = /^([^@]+@[^@]+|[a-z]{4}([a-z]{2})?)$/;
	router.param('login', (req, res, next, val) => {
		if (loginRegex.test(val)) { next(); }
		else {
			const err = new Error();
			err.statusCode = 404;
			next(err);
		}
	});
	router.use('/:login', route$$login());

	router.use('/:codeholderId(\\d+)', route$$codeholderId());

	const codeholderIdsRegex = /^\d+(,\d+){0,99}$/;
	router.param('codeholderIds', (req, res, next, val) => {
		if (codeholderIdsRegex.test(val)) { next(); }
		else {
			const err = new Error();
			err.statusCode = 404;
			next(err);
		}
	});
	router.use('/:codeholderIds', route$$codeholderIds());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
