import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import method$get from './get';
import method$delete from './delete';
import method$patch from './patch';

import operation$resend_confirmation_notif from './!resend_confirmation_notif';

/**
 * Sets up /congresses/{congressId}/instances/{instanceId}/participants/{dataId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });
	
	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'delete', method$delete);
	bindMethod(router, '/', 'patch', method$patch);

	bindMethod(router, '/!resend_confirmation_notif', 'post', operation$resend_confirmation_notif);

	return router;
}
