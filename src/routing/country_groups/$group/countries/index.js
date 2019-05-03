import express from 'express';

import { init as route$$country } from './$country';

/**
 * Sets up /country_groups/{group}/countries
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:country([a-z]{2})', route$$country());

	return router;
}
