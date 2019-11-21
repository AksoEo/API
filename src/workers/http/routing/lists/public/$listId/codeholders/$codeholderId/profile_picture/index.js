import express from 'express';

import { profilePictureSizes } from 'akso/workers/http/routing/codeholders/schema';

import { init as route$$size } from './$size';

/**
 * Sets up /lists/public/{listId}/codeholders/{codeholderId}/profile_picture
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	const sizeRegex = /^(\d+)px$/;
	router.param('size', (req, res, next, val) => {
		const sizeData = sizeRegex.exec(val);
		if (!sizeData) { return next('route'); }
		req.params.size = parseInt(sizeData[1], 10);
		if (!profilePictureSizes.includes(req.params.size)) { next('route'); }
		else { next(); }
	});
	router.use('/:size(\\d+px)', route$$size());

	return router;
}
