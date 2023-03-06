import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$admin_groups } from './admin_groups';
import { init as route$congress_participations } from './congress_participations';
import { init as route$delegations } from './delegations';
import { init as route$files } from './files';
import { init as route$hist } from './hist';
import { init as route$logins } from './logins';
import { init as route$magazine_subscriptions } from './magazine_subscriptions';
import { init as route$member_restrictions } from './member_restrictions';
import { init as route$membership } from './membership';
import { init as route$permissions } from './permissions';
import { init as route$profile_picture } from './profile_picture';
import { init as route$roles } from './roles';

import method$get from './get';
import method$patch from './patch';
import method$delete from './delete';

import operation$disable_totp from './!disable_totp';

/**
 * Sets up /codeholders/{codeholderId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/admin_groups', route$admin_groups());
	router.use('/congress_participations', route$congress_participations());
	router.use('/delegations', route$delegations());
	router.use('/files', route$files());
	router.use('/hist', route$hist());
	router.use('/logins', route$logins());
	router.use('/magazine_subscriptions', route$magazine_subscriptions());
	router.use('/member_restrictions', route$member_restrictions());
	router.use('/membership', route$membership());
	router.use('/permissions', route$permissions());
	router.use('/profile_picture', route$profile_picture());
	router.use('/roles', route$roles());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'patch', method$patch);
	bindMethod(router, '/', 'delete', method$delete);

	bindMethod(router, '/!disable_totp', 'post', operation$disable_totp);

	return router;
}
