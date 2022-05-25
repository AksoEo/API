import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$unsubscriptions } from './unsubscriptions';

import method$get from './get';
import method$patch from './patch';
import method$delete from './delete';

import operation$send_notif_template from './!send_notif_template';

/**
 * Sets up /newsletters/{newsletterId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/unsubscriptions', route$unsubscriptions());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'patch', method$patch);
	bindMethod(router, '/', 'delete', method$delete);

	bindMethod(router, '/!send_notif_template', 'post', operation$send_notif_template);

	return router;
}
