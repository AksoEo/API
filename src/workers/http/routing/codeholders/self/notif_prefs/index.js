import express from 'express';

import { init as route$builtin$category } from './builtin:$category';
import { init as route$global } from './global';

/**
 * Sets up /codeholders/self/notif_prefs
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use((req, res, next) => { // eslint-disable-line no-unused-vars
		if (!req.user || !req.user.isUser()) {
			return res.sendStatus(404);
		}
		next();
	});

	router.use('/global', route$global());
	router.use('/builtin\\::category', route$builtin$category());

	return router;
}
