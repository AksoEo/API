import express from 'express';

import { init as route$profile_picture } from './profile_picture';

/**
 * Sets up /votes/{voteId}/codeholder_options/{codeholderId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/profile_picture', route$profile_picture());

	return router;
}
