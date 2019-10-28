import express from 'express';

import { init as route$$datum } from './$datum';

/**
 * Sets up /codeholders/{codeholderId}/hist
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:datum(\\w+)', route$$datum());

	return router;
}
