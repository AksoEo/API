export async function createRoles () {
	await AKSO.db('codeholderRoles')
		.insert(

			/*eslint-disable */
			[
				{"id":"1","name":"Estrarano (UEA)","description":null},
				{"id":"2","name":"Estrarano (TEJO)","description":null},
				{"id":"3","name":"Komitatano A (TEJO)","description":null},
				{"id":"4","name":"Komitatano B (TEJO)","description":null},
				{"id":"5","name":"Komitatano C (TEJO)","description":null},
				{"id":"6","name":"Komitatano Ĉ (TEJO)","description":null},
				{"id":"7","name":"Oficisto (UEA)","description":null},
				{"id":"8","name":"Oficisto (TEJO)","description":null},
				{"id":"9","name":"Volontulo (UEA)","description":null},
				{"id":"10","name":"Volontulo (TEJO)","description":null},
				{"id":"11","name":"Komitatano A (UEA)","description":null},
				{"id":"12","name":"Komitatano B (UEA)","description":null},
				{"id":"13","name":"Komitatano C (UEA)","description":null},
				{"id":"14","name":"Blindulo","description":null},
				{"id":"15","name":"Surdulo","description":null}
			]
			/*eslint-enable */

		);
}
