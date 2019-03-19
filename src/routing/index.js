import express from 'express';

/**
 * Sets up all http routing
 * @return {express.Router}
 */
export default function init () {
	const router = new express.Router();

	router.all('/', (req, res, next) => {
		console.log(req.method);
		console.log(req.url);
		console.log(req.body);
		console.log(req.query);

		res.sendStatus(204);
	});

	return router;
}
