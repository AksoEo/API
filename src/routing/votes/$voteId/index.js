import express from 'express';

import { bindMethod } from '../..';

import method$get from './get';
import method$delete from './delete';

/**
 * Sets up /votes/{voteId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'delete', method$delete);

	return router;
}
