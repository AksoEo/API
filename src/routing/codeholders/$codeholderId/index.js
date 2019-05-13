import express from 'express';

import { bindMethod } from '../..';

import { init as route$files } from './files';
import { init as route$logins } from './logins';
import { init as route$membership } from './membership';
import { init as route$profile_picture } from './profile_picture';

import method$get from './get';
import method$patch from './patch';
import method$delete from './delete';

/**
 * Sets up /codeholders/{codeholderId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/files', route$files());
	router.use('/logins', route$logins());
	router.use('/membership', route$membership());
	router.use('/profile_picture', route$profile_picture());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'patch', method$patch);
	bindMethod(router, '/', 'delete', method$delete);

	return router;
}
