export async function createRoles () {
	await AKSO.db('codeholderRoles')
		.insert(

			/*eslint-disable */
			[
				{"id":"1","name":"Estrarano (UEA)","description":null,public:true},
				{"id":"2","name":"Estrarano (TEJO)","description":null,public:true},
				{"id":"3","name":"Komitatano A (TEJO)","description":null,public:true},
				{"id":"4","name":"Komitatano B (TEJO)","description":null,public:true},
				{"id":"5","name":"Komitatano C (TEJO)","description":null,public:true},
				{"id":"6","name":"Komitatano Ĉ (TEJO)","description":null,public:true},
				{"id":"7","name":"Oficisto (UEA)","description":null,public:true},
				{"id":"8","name":"Oficisto (TEJO)","description":null,public:true},
				{"id":"9","name":"Volontulo (UEA)","description":null,public:true},
				{"id":"10","name":"Volontulo (TEJO)","description":null,public:true},
				{"id":"11","name":"Komitatano A (UEA)","description":null,public:true},
				{"id":"12","name":"Komitatano B (UEA)","description":null,public:true},
				{"id":"13","name":"Komitatano C (UEA)","description":null,public:true},
				{"id":"14","name":"Blindulo","description":null},
				{"id":"15","name":"Surdulo","description":null}
			]
			/*eslint-enable */

		);
}
