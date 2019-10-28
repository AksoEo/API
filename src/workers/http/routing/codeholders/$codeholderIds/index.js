import express from 'express';

import { init as route$address } from './address';

/**
 * Sets up /codeholders/{codeholderIds}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/address', route$address());

	return router;
}
