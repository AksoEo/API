import * as AKSODb from 'akso/db';

import { createUniversalData } from './universal-data';
import { createUniversalTestData } from './universal-test-data';
import { createDevData } from './dev-data';

async function init () {
	global.AKSO = {
		conf: {
			mysql: {
				host: process.env.AKSO_MYSQL_HOST,
				user: process.env.AKSO_MYSQL_USER,
				password: process.env.AKSO_MYSQL_PASSWORD,
				database: process.env.AKSO_MYSQL_DATABASE
			}
		},
		db: null,
		log: (...log) => console.log(...log) // eslint-disable-line no-console
	};

	const mode = process.argv[2] || 'prod';

	AKSO.log('Initializing db ...');
	await AKSODb.init();
	AKSO.log('done.\n');

	AKSO.log('Setting up universal data ...');
	await createUniversalData();
	AKSO.log('done.\n');

	if ([ 'test', 'dev' ].includes(mode)) {
		AKSO.log('Setting up universal testing data ...');
		await createUniversalTestData();
		AKSO.log('done.\n');
	}
	
	if (mode === 'dev') {
		AKSO.log('Setting up dev data ...');
		await createDevData();
		AKSO.log('done.\n');
	}
}

init()
	.then(() => { process.exit(0); })
	.catch(err => {
		console.log(err); // eslint-disable-line no-console
		process.exit(1);
	});
