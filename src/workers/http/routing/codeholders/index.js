import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$login } from './$login';
import { init as route$$codeholderId } from './$codeholderId';
import { init as route$$codeholderIds } from './$codeholderIds';
import { init as route$self } from './self';
import { init as route$codes_available } from './codes_available';
import { init as route$roles } from './roles';
import { init as route$change_requests } from './change_requests';

import method$get from './get';
import method$post from './post';

import operation$make_address_labels from './!make_address_labels';
import operation$send_notif_template from './!send_notif_template';

/**
 * Sets up /codeholders
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/self', route$self());
	router.use('/codes_available', route$codes_available());
	router.use('/roles', route$roles());
	router.use('/change_requests', route$change_requests());
	
	router.use('/:codeholderId(\\d+)', route$$codeholderId());

	const codeholderIdsRegex = /^\d+(,\d+){0,99}$/;
	router.param('codeholderIds', (req, res, next, val) => {
		if (codeholderIdsRegex.test(val)) { next(); }
		else { next('route'); }
	});
	router.use('/:codeholderIds', route$$codeholderIds());

	const loginRegex = /^([^@]+@[^@]+|[a-z]{4}([a-z\\-][a-z])?)$/;
	router.param('login', (req, res, next, val) => {
		if (loginRegex.test(val)) { next(); }
		else { next('route'); }
	});
	router.use('/:login', route$$login());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	bindMethod(router, '/!make_address_labels', 'post', operation$make_address_labels);
	bindMethod(router, '/!send_notif_template', 'post', operation$send_notif_template);

	return router;
}
