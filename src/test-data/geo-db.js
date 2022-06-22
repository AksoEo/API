/* eslint-disable no-console */

import knex from 'knex';

const MAX_POPULATION = 100 * 10**6;

async function iterateTable ({ query, fn }) {
	const limit = 1000;

	let data;
	let offset = 0;
	do {
		const newQuery = query.clone()
			.limit(limit)
			.offset(offset);
		data = await newQuery;
		if (!data.length) { break; }
		offset += limit;
		await fn(data);
	} while (data.length);
}

async function init () {
	console.log('Creating destination database');

	let mysql = knex({
		client: 'mysql2',
		asyncStackTraces: true,
		connection: {
			host: process.env.AKSO_MYSQL_HOST,
			user: process.env.AKSO_MYSQL_USER,
			password: process.env.AKSO_MYSQL_PASSWORD
		},
		pool: { min: 2, max: 20 }
	});
	await mysql.raw('CREATE DATABASE ?? DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
		process.env.AKSO_MYSQL_GEODB_DATABASE);
	await mysql.destroy();
	mysql = knex({
		client: 'mysql2',
		asyncStackTraces: true,
		connection: {
			host: process.env.AKSO_MYSQL_HOST,
			user: process.env.AKSO_MYSQL_USER,
			password: process.env.AKSO_MYSQL_PASSWORD,
			database: process.env.AKSO_MYSQL_GEODB_DATABASE
		},
		pool: { min: 2, max: 20 }
	});

	console.log('Creating schema');
	await mysql.schema.createTable('cities', function (table) {
		table.bigInteger('id').unsigned().primary();
		table.specificType('country', 'CHAR(2)').notNullable().index();
		table.integer('population').unsigned().nullable().index();
		table.string('nativeLabel').nullable().index('nativeLabel_index', 'FULLTEXT');
		table.string('eoLabel').nullable().index('eoLabel_index', 'FULLTEXT');
		table.string('subdivision_nativeLabel').nullable().index('subdivision_nativeLabel_index', 'FULLTEXT');
		table.string('subdivision_eoLabel').nullable().index('subdivision_eoLabel_index', 'FULLTEXT');
		table.string('subdivision_iso').nullable().index('subdivision_iso_index');
	});

	await mysql.schema.createTable('cities_ll', function (table) {
		table.bigInteger('id').unsigned().primary();
		table.specificType('ll', 'POINT').notNullable().index('ll_index', 'SPATIAL');
	
		table.foreign('id').references('cities.id').onUpdate('CASCADE').onDelete('CASCADE');
	});

	await mysql.schema.createTable('cities_labels', function (table) {
		table.bigInteger('id').unsigned();
		table.string('lang').notNullable();
		table.string('label').notNullable().index('label_index', 'FULLTEXT');
		
		table.primary(['id', 'lang']);
		table.foreign('id').references('cities.id').onUpdate('CASCADE').onDelete('CASCADE');
	});

	console.log('Connecting to geo-db');
	const sqlite = knex({
		client: 'better-sqlite3',
		useNullAsDefault: true,
		connection: {
			filename: process.env.GEODB_PATH
		}
	});

	console.log('Inserting cities');
	await iterateTable({
		query:
			sqlite('cities')
				.select('id', 'country', 'population', 'native_label', 'eo_label', '2nd_native_label', '2nd_eo_label', '2nd_iso')
				.orderBy('id'),
		
		fn: async function (rows) {
			await mysql('cities').insert(rows.map(row => {
				if (row.native_label && typeof row.native_label !== 'string') {
					console.warn(`Warn! ${row.id} has a non-string native label`);
				}
				if (row.native_label && row.native_label.toString().length > 255) {
					console.warn(`Warn! ${row.id} has a truncated native label`);
				}

				if (row.population > MAX_POPULATION) {
					console.warn(`Warn! ${row.id} has an unreasonably high population, ignoring`);
				}

				if (row.eo_label && typeof row.eo_label !== 'string') {
					console.warn(`Warn! ${row.id} has a non-string eo label`);
				}
				if (row.eo_label && row.eo_label.toString().length > 255) {
					console.warn(`Warn! ${row.id} has a truncated eo label`);
				}

				if (row['2nd_native_label'] && typeof row['2nd_native_label'] !== 'string') {
					console.warn(`Warn! ${row.id} has a non-string subdivision native label`);
				}
				if (row['2nd_native_label'] && row['2nd_native_label'].toString().length > 255) {
					console.warn(`Warn! ${row.id} has a truncated subdivision native label`);
				}

				if (row['2nd_eo_label'] && typeof row['2nd_eo_label'] !== 'string') {
					console.warn(`Warn! ${row.id} has a non-string subdivision eo label`);
				}
				if (row['2nd_eo_label'] && row['2nd_eo_label'].toString().length > 255) {
					console.warn(`Warn! ${row.id} has a truncated subdivision eo label`);
				}

				return {
					id: row.id.substring(1),
					country: row.country,
					population: Math.min(row.population, MAX_POPULATION),
					nativeLabel: row.native_label ? row.native_label.toString().substring(0, 255) : null,
					eoLabel: row.eo_label ? row.eo_label.toString().substring(0, 255) : null,
					subdivision_nativeLabel: row['2nd_native_label'] ? row['2nd_native_label'].toString().substring(0, 255) : null,
					subdivision_eoLabel: row['2nd_eo_label'] ? row['2nd_eo_label'].toString().substring(0, 255) : null,
					subdivision_iso: row['2nd_iso']
				};
			}));
		}
	});

	console.log('Inserting city coordinates');
	await iterateTable({
		query:
			sqlite('cities')
				.select('id', 'lat', 'lon')
				.whereNotNull('lat')
				.whereNotNull('lon')
				.orderBy('id'),

		fn: async function (rows) {
			await mysql('cities_ll').insert(rows.map(row => {
				return {
					id: row.id.substring(1),
					ll: mysql.raw(`POINT(${row.lat},${row.lon})`)
				};
			}));
		}
	});

	console.log('Inserting city labels');
	await iterateTable({
		query:
			sqlite('cities_labels')
				.select('id', 'lang', 'label')
				.orderBy('id'),

		fn: async function (rows) {
			await mysql('cities_labels').insert(rows.map(row => {
				if (row.label && typeof row.label !== 'string') {
					console.warn(`Warn! ${row.id}:${row.lang} has a non-string label`);
				}
				if (row.label && row.label.toString().length > 255) {
					console.warn(`Warn! ${row.id}:${row.lang} has a truncated label`);
				}
				return {
					id: row.id.substring(1),
					lang: row.lang,
					label: row.label ? row.label.toString().substring(0, 255) : ''
				};
			}));
		}
	});

	console.log('Done!');
	console.log('Closing databases');
	await sqlite.destroy();
	await mysql.destroy();
}

init()
	.then(() => { process.exit(0); })
	.catch(err => {
		console.log(err); // eslint-disable-line no-console
		process.exit(1);
	});
