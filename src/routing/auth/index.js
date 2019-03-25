import express from 'express';

import { bindMethod } from '..';

import method$put from './put';

/**
 * Sets up /auth
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	bindMethod(router, '/', 'put', method$put);

	return router;
}
