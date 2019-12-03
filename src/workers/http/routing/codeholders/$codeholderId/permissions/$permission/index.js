import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import method$put from './put';
import method$delete from './delete';

/**
 * Sets up /codeholders/{codeholderId}/permissions/{permission}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	bindMethod(router, '/', 'put', method$put);
	bindMethod(router, '/', 'delete', method$delete);

	return router;
}
