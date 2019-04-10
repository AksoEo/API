import express from 'express';

import { init as route$$language } from './$language';

/**
 * Sets up /codeholders/{codeholderIds}/address
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:language([a-z]{2})', route$$language());

	return router;
}
