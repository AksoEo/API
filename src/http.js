import express from 'express';

export default function init () {
	const app = express();

	// TODO: Routing

	app.listen(AKSO.conf.http.port, () => {
		AKSO.log.info(`HTTP server listening on :${AKSO.conf.http.port}`);
	});
};
