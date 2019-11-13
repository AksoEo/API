import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$size } from './$size';

import method$put from './put';
import method$delete from './delete';

import { thumbnailSizes } from './schema';

/**
 * Sets up /magazines/{magazineId}/editions/{editionId}/thumbnail
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	const sizeRegex = /^(\d+)px$/;
	router.param('size', (req, res, next, val) => {
		const sizeData = sizeRegex.exec(val);
		if (!sizeData) { return next('route'); }
		req.params.size = parseInt(sizeData[1], 10);
		if (!thumbnailSizes.includes(req.params.size)) { next('route'); }
		else { next(); }
	});
	router.use('/:size', route$$size());

	bindMethod(router, '/', 'put', method$put);
	bindMethod(router, '/', 'delete', method$delete);

	return router;
}
