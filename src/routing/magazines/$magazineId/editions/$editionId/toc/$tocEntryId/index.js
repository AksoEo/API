import express from 'express';

import { bindMethod } from '../../../../../..';

import method$get from './get';
import method$patch from './patch';

/**
 * Sets up /magazines/{magazineId}/editions/{editionId}/toc/{tocEntryId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'patch', method$patch);

	return router;
}
