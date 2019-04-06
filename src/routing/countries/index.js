import express from 'express';

import { bindMethod } from '..';

import method$get from './get';

/**
 * Sets up /countries
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	bindMethod(router, '/', 'get', method$get);

	return router;
}