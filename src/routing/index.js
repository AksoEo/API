import express from 'express';

/**
 * Sets up all http routing
 * @return {express.Router}
 */
export default function init () {
	const router = new express.Router();

	router.all('/', (req, res, next) => {
		res.sendStatus(204); // todo: remove
	});

	return router;
}
