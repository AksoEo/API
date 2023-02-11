import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$result } from './result';
import { init as route$stats } from './stats';

import method$get from './get';
import method$delete from './delete';
import method$patch from './patch';

import operation$send_cast_ballot_notif from './!send_cast_ballot_notif';

/**
 * Sets up /votes/{voteId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/result', route$result());
	router.use('/stats', route$stats());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'delete', method$delete);
	bindMethod(router, '/', 'patch', method$patch);

	bindMethod(router, '/!send_cast_ballot_notif', 'post', operation$send_cast_ballot_notif);

	return router;
}
