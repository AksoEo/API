import express from 'express';
import { base32 } from 'rfc4648';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$registrationEntryId } from './$registrationEntryId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /registration/entries
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.param('registrationEntryId', (req, res, next, val) => {
		try {
			req.params.registrationEntryId = base32.parse(val, { out: Buffer.allocUnsafe, loose: true });
		} catch {
			return next('route');
		}
		next();
	});
	router.use('/:registrationEntryId', route$$registrationEntryId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
