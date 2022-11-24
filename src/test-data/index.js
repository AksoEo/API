import crypto from 'pn/crypto';

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

	if (mode === 'client') {
		AKSO.log('Creating client ...');
		const apiKey = await crypto.randomBytes(16);
		const apiSecret = await crypto.randomBytes(32);
		await AKSO.db('clients')
			.insert({
				apiKey,
				apiSecret: crypto.createHash('sha256').update(apiSecret.toString('hex')).digest(),
				name: 'Provizora AKSO-instalkliento',
				ownerName: 'AKSO',
				ownerEmail: 'admin@akso.org',
			});

		AKSO.log('Setting up admin group ...');
		await AKSO.db('admin_groups')
			.insert({
				id: 1,
				name: 'Ĉefadministranto',
				description: 'Havas ĉiujn rajtojn',
			});
		await AKSO.db('admin_permissions_groups')
			.insert({
				adminGroupId: 1,
				permission: '*',
			});
		await AKSO.db('admin_permissions_memberRestrictions_groups')
			.insert({
				adminGroupId: 1,
				filter: '{}',
				fields: null,
			});
		await AKSO.db('admin_groups_members_clients')
			.insert({
				adminGroupId: 1,
				apiKey,
			});

		console.log(); // eslint-disable-line no-console
		AKSO.log(`Key: ${apiKey.toString('hex')}`);
		AKSO.log(`Secret: ${apiSecret.toString('hex')}\n`);
		AKSO.log('done.\n');
	} else {
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
}

init()
	.then(() => { process.exit(0); })
	.catch(err => {
		console.log(err); // eslint-disable-line no-console
		process.exit(1);
	});
