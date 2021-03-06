export async function createMembershipCategories () {
	await AKSO.db('membershipCategories')
		.insert([
			/*eslint-disable */
			{"id":"1","nameAbbrev":"MG","name":"Membro kun Gvidlibro","description":"Individua membro, kiu ricevas nur la *Gvidlibron* tra la Esperanto-movado plus la revuon *Esperanto* rete.","givesMembership":"1","lifetime":"0","availableFrom":null,"availableTo":"2018"},
			{"id":"2","nameAbbrev":"MJ","name":"Membro kun Jarlibro","description":"Membro kun Jarlibro plus la reta versio de la revuo Esperanto (kaj, ĝis inkl. 35 jaroj, membro de TEJO kun la revuo Kontakto sen plia abonpago).","givesMembership":"1","lifetime":"0","availableFrom":null,"availableTo":"2018"},
			{"id":"3","nameAbbrev":"MB","name":"Membro Baza","description":"Donas retan aliron al UEA-servoj: reta revuo *Esperanto*, Delegita Reto (reta jarlibro). TEJO-aĝaj membroj (ĝis inkluzive 35 jarojn je la komenco de la jaro) aldone ricevas retan revuon *Kontakto*.","givesMembership":"1","lifetime":"0","availableFrom":"2019","availableTo":null},
			{"id":"4","nameAbbrev":"DMB","name":"Dumviva Membro Baza","description":"Kiel Membro Baza, sed validas vian tutan vivon.","givesMembership":"1","lifetime":"1","availableFrom":"2019","availableTo":null},
			{"id":"5","nameAbbrev":"DMJ","name":"Dumviva Membro kun Jarlibro","description":"Kiel Membro kun Jarlibro sed validas vian tutan vivon.","givesMembership":"1","lifetime":"1","availableFrom":null,"availableTo":"2018"},
			{"id":"6","nameAbbrev":"MA","name":"Membro-Abonanto","description":"Kiel MB plus la revuo *Esperanto* (surpapera). TEJO-aĝaj membroj ricevas aldone revuon *Kontakto* papere.","givesMembership":"1","lifetime":"0","availableFrom":null,"availableTo":null},
			{"id":"7","nameAbbrev":"DMA","name":"Dumviva Membro-Abonanto","description":"Kiel DMA sed validas vian tutan vivon.","givesMembership":"1","lifetime":"1","availableFrom":null,"availableTo":null},
			{"id":"8","nameAbbrev":"HM","name":"Honora Membro","description":"Honoraj Membroj estas elektitaj esperantistoj, kiuj faris gravajn servojn al la tutmonda Esperanto-movado.","givesMembership":"1","lifetime":"1","availableFrom":null,"availableTo":null},
			{"id":"9","nameAbbrev":"HPK","name":"Honora Patrono","description":"La Honora Patrona Komitato konsistas el lingvistoj, sciencistoj kaj aliaj eminentaj personoj, kiuj faris gravajn servojn al la Esperanto-movado, kaj mem parolas la internacian lingvon.","givesMembership":"1","lifetime":"1","availableFrom":null,"availableTo":null},
			{"id":"10","nameAbbrev":"DP","name":"Dumviva Patrono de UEA","description":"","givesMembership":"0","lifetime":"1","availableFrom":null,"availableTo":null},
			{"id":"11","nameAbbrev":"SZ","name":"Membro de Societo Zamenhof","description":"Finance apogas Universalan Esperanto-Asocion.","givesMembership":"0","lifetime":"0","availableFrom":null,"availableTo":null},
			{"id":"12","nameAbbrev":"PT","name":"Patrono de TEJO","description":"Finance apogas Tutmondan Esperantistan Junularan Organizon, kaj ricevas papere la eldonaĵojn de TEJO.","givesMembership":"0","lifetime":"0","availableFrom":null,"availableTo":null},
			{"id":"13","nameAbbrev":"DPT","name":"Dumviva Patrono de TEJO","description":"Kiel PT sed validas vian tutan vivon.","givesMembership":"0","lifetime":"1","availableFrom":null,"availableTo":null}
			/*eslint-enable */
		]);
}
