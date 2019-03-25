export async function init () {
	AKSO.log.info('Establishing connection to MySQL server ...');

	AKSO.db = require('knex')({
		client: 'mysql2',
		asyncStackTraces: true,
		connection: {
			host: AKSO.conf.mysql.host,
			user: AKSO.conf.mysql.user,
			password: AKSO.conf.mysql.password,
			database: AKSO.conf.mysql.database
		}
	});

	// Check if the connection works
	await AKSO.db.raw('select 1+1');

	AKSO.log.info('... MySQL client ready');
}
