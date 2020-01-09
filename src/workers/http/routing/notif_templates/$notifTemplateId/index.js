import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$render } from './render';

import method$get from './get';
import method$delete from './delete';
import method$patch from './patch';

/**
 * Sets up /notif_templates/{notifTemplateId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/render', route$render());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'delete', method$delete);
	bindMethod(router, '/', 'patch', method$patch);

	return router;
}
