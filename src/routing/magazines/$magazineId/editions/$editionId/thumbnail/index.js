import express from 'express';

import { bindMethod } from '../../../../..';

import method$put from './put';

/**
 * Sets up /magazines/{magazineId}/editions/{editionId}/thumbnail
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	bindMethod(router, '/', 'put', method$put);

	return router;
}
