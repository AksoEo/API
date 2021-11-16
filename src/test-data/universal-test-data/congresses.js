export async function createCongresses () {
	await AKSO.db('congresses')
		.insert([
			{
				id: 1,
				name: 'Universala Kongreso',
				org: 'uea',
				abbrev: 'UK'
			},
			{
				id: 2,
				name: 'Internacia Junulara Kongreso',
				org: 'tejo',
				abbrev: 'IJK'
			}
		]);

	await AKSO.db.raw(`
		INSERT INTO \`congresses_instances\` (\`id\`, \`congressId\`, \`name\`, \`humanId\`, \`dateFrom\`, \`dateTo\`, \`locationName\`, \`locationNameLocal\`, \`locationCoords\`, \`locationAddress\`, \`tz\`) VALUES
		(1, 1, 'La 105-a UK en Montrealo, Kanado (2020)', '2020', '2020-08-01', '2020-08-08', 'Montrealo, Kanado', 'Montréal', 0x000000000101000000d4ba0d6abfbf46407e1ccd91956452c0, 'Le Centre Sheraton Montreal Hotel\r\n1201 René-Lévesque Blvd W\r\nMontreal, QC H3B 2L7', 'America/Montreal'),
		(2, 1, 'La 104-a UK en Lahtio, Finnlando (2020)', '2019', '2019-07-20', '2019-07-27', 'Lahtio, Finnlando', 'Lahti', 0x000000000101000000f0315871aa7d4e407e39b35da1a33940, 'Isku Areena\r\nSvinhufvudinkatu 29\r\nFI-15110 Lahti', 'Europe/Helsinki'),
		(3, 2, 'La 76-a IJK en Someren, Nederlando (2020)', '2020', '2020-07-11', '2020-07-18', 'Someren, Nederlando', NULL, 0x000000000101000000b7ef517fbdb04940365b79c9ffc41640, 'De Hoof 18\n5712 LM Someren', 'Europe/Amsterdam');
	`);

	await AKSO.db('congresses_instances_locations')
		.insert([
			/*eslint-disable */
			{"id":"1","congressInstanceId":"3","type":"external","name":"Kongresejo","description":"La ejo kie okazas ĉio de la IJK!"},
			{"id":"2","congressInstanceId":"3","type":"internal","name":"Manĝejo","description":"Kie oni manĝas"},
			{"id":"3","congressInstanceId":"3","type":"internal","name":"Akceptejo","description":null},
			{"id":"4","congressInstanceId":"3","type":"external","name":"Amsterdamo Flughaveno","description":"La plej granda flughaveno en Nederlando estas Schiphol (AMS)"},
			{"id":"5","congressInstanceId":"3","type":"internal","name":"Necesejo","description":null}
			/*eslint-enable */
		]);

	await AKSO.db.raw(`
		INSERT INTO \`congresses_instances_locations_external\` (\`congressInstanceLocationId\`, \`address\`, \`ll\`, \`icon\`) VALUES
		(1, 'De Hoof 18\n5712 LM Someren', 0x000000000101000000b7ef517fbdb04940365b79c9ffc41640, 'STAR'),
		(4, 'Evert van de Beekstraat 202, 1118 CP Schiphol, Nederlando', 0x00000000010100000067d7bd1589274a40db899290480b1340, 'AIRPORT');
	`);

	await AKSO.db('congresses_instances_locations_external_rating')
		.insert([
			/*eslint-disable */
			{"congressInstanceLocationId":"1","rating":"1.50","rating_max":"5","rating_type":"stars"},
			{"congressInstanceLocationId":"4","rating":"5.00","rating_max":"5","rating_type":"hearts"}
			/*eslint-enable */
		]);

	await AKSO.db('congresses_instances_locations_internal')
		.insert([
			/*eslint-disable */
			{"congressInstanceLocationId":"5","externalLoc":null},
			{"congressInstanceLocationId":"2","externalLoc":"1"},
			{"congressInstanceLocationId":"3","externalLoc":"1"}
			/*eslint-enable */
		]);

	await AKSO.db('congresses_instances_locations_openHours')
		.insert([
			/*eslint-disable */
			{"congressInstanceLocationId":"3","date":"2020-07-12","openTime":"07:30:00","closeTime":"10:00:00"},
			{"congressInstanceLocationId":"3","date":"2020-07-12","openTime":"13:00:00","closeTime":"14:30:00"},
			{"congressInstanceLocationId":"5","date":"2020-07-12","openTime":"00:00:00","closeTime":"16:00:00"},
			{"congressInstanceLocationId":"3","date":"2020-07-11","openTime":"17:00:00","closeTime":"20:00:00"},
			{"congressInstanceLocationId":"3","date":"2020-07-12","openTime":"17:00:00","closeTime":"20:00:00"},
			{"congressInstanceLocationId":"5","date":"2020-07-11","openTime":"15:00:00","closeTime":"23:59:00"},
			{"congressInstanceLocationId":"5","date":"2020-07-12","openTime":"17:00:00","closeTime":"23:59:00"}
			/*eslint-enable */
		]);

	await AKSO.db('congresses_instances_locationTags')
		.insert([
			/*eslint-disable */
			{"id":"1","congressInstanceId":"3","name":"Kongreso"},
			{"id":"2","congressInstanceId":"3","name":"Urbo"},
			{"id":"3","congressInstanceId":"3","name":"Alveno"}
			/*eslint-enable */
		]);

	await AKSO.db('congresses_instances_locations_tags')
		.insert([
			{
				congressInstanceLocationId: 1,
				congressInstanceLocationTagId: 1
			}
		]);

	await AKSO.db('congresses_instances_programs')
		.insert([
			/*eslint-disable */
			{"id":"1","congressInstanceId":"3","title":"Interkona vespero","description":"Konatiĝu kun ĉiuj la aliaj partoprenantoj!","owner":null,"timeFrom":"1594490400","timeTo":"1594495800","location":"2"},
			{"id":"2","congressInstanceId":"3","title":"Vespermanĝo","description":"Plenigu viajn stomakojn je bongusta nederlanda terpomaĵo","owner":null,"timeFrom":"1594479600","timeTo":"1594483200","location":"3"}
			/*eslint-enable */
		]);

	await AKSO.db('congresses_instances_programTags')
		.insert([
			{
				id: 1,
				congressInstanceId: 3,
				name: 'Por novuloj'
			}
		]);

	await AKSO.db('congresses_instances_programs_tags')
		.insert([
			{
				congressInstanceProgramId: 1,
				congressInstanceProgramTagId: 1
			}
		]);
}
