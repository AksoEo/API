import Enum from './enum';

import { union, NULL, STRING, NUMBER, BOOL, array as ascArray } from '@tejo/akso-script';

const formValues = {
	CODEHOLDER: {
		'codeholder.id': NUMBER,
		'codeholder.name': STRING,
		'codeholder.oldCode': union([ NULL, STRING ]),
		'codeholder.newCode': STRING,
		'codeholder.codeholderType': STRING,
		'codeholder.hasPassword': BOOL,
		'codeholder.addressFormatted': union([ NULL, STRING ]),
		'codeholder.addressLatin.country': union([ NULL, STRING ]),
		'codeholder.addressLatin.countryArea': union([ NULL, STRING ]),
		'codeholder.addressLatin.cityArea': union([ NULL, STRING ]),
		'codeholder.addressLatin.streetAddress': union([ NULL, STRING ]),
		'codeholder.addressLatin.postalCode': union([ NULL, STRING ]),
		'codeholder.addressLatin.sortingCode': union([ NULL, STRING ]),
		'codeholder.feeCountry': union([ NULL, STRING ]),
		'codeholder.email': union([ NULL, STRING ]),
		'codeholder.birthdate': union([ NULL, STRING ]),
		'codeholder.cellphone': union([ NULL, STRING ]),
		'codeholder.officePhone': union([ NULL, STRING ]),
		'codeholder.landlinePhone': union([ NULL, STRING ]),
		'codeholder.age': union([ NULL, NUMBER ]),
		'codeholder.agePrimo': union([ NULL, NUMBER ])
	}
};
formValues.NEWSLETTER = {
	...formValues.CODEHOLDER,
};
formValues.NEWSLETTER_MAGAZINE = {
	...formValues.NEWSLETTER,

	'magazine.id': NUMBER,
	'magazine.org': STRING,
	'magazine.name': STRING,
	'magazine.description': union([ NULL, STRING ]),
	'magazine.issn': union([ NULL, STRING ]),
	'magazine.magazineURL': STRING,

	'edition.id': NUMBER,
	'edition.idHuman': union([ NULL, STRING ]),
	'edition.date': STRING,
	'edition.thumbnailURL': union([ NULL, STRING ]),
	'edition.description': union([ NULL, STRING ]),
	'edition.editionURL': STRING,

	'toc.md': STRING,
	'toc.html': STRING,
	'toc.text': STRING,
};
formValues.CONGRESS = {
	'registrationEntry.price': union([ NULL, NUMBER ]),
	'registrationEntry.currency': union([ NULL, STRING ]),
	'registrationEntry.sequenceId': union([ NULL, NUMBER ]),
	'registrationEntry.createdTime': NUMBER,
	'registrationEntry.canEdit': BOOL,
	'registrationEntry.dataId': STRING,
	'registrationEntry.dataKeys': ascArray(STRING),
	'registrationEntry.dataMeta': ascArray(union([ NULL, NUMBER, STRING, BOOL ])),
	'registrationEntry.dataVals': ascArray(union([ NULL, NUMBER, STRING, BOOL, ascArray(union([ BOOL, NULL ])) ])),
};
formValues.CONGRESS_REGISTRATION = {...formValues.CONGRESS};
formValues.VOTE_CAST_BALLOT = {
	...formValues.CODEHOLDER,

	'vote.id': NUMBER,
	'vote.org': STRING,
	'vote.name': STRING,
	'vote.description': union([ NULL, STRING ]),
	'vote.timeStart': NUMBER,
	'vote.timeEnd': NUMBER,
	'vote.hasStarted': BOOL,
	'vote.ballotsSecret': BOOL,
	'vote.type': STRING,
	'vote.publishVoters': BOOL,
	'vote.publishResults': BOOL,
	'vote.optionsKeys': union([ NULL, ascArray(ascArray(STRING)) ]),
	'vote.optionsVals': union([ NULL, ascArray(ascArray(union([ STRING, NUMBER, NULL ]))) ]),
};

const bogusData = {
	CODEHOLDER: {
		'codeholder.id': 1,
		'codeholder.name': 'Ludoviko Zamenhof',
		'codeholder.oldCode': 'zmld-w',
		'codeholder.newCode': 'zamlud',
		'codeholder.codeholderType': 'human',
		'codeholder.hasPassword': true,
		'codeholder.addressFormatted': 
`Esperantostrato 42
2020 Bjalistoko
POLLANDO`,
		'codeholder.addressLatin.country': 'pl',
		'codeholder.addressLatin.countryArea': null,
		'codeholder.addressLatin.city': 'Bjalistoko',
		'codeholder.addressLatin.cityArea': null,
		'codeholder.addressLatin.streetAddress': 'Esperantostrato 42',
		'codeholder.addressLatin.postalCode': '2020',
		'codeholder.addressLatin.sortingCode': null,
		'codeholder.feeCountry': 'pl',
		'codeholder.email': 'zamenhof@example.org',
		'codeholder.birthdate': '1859-12-15',
		'codeholder.cellphone': null,
		'codeholder.officePhone': null,
		'codeholder.landlinePhone': null,
		'codeholder.age': 57,
		'codeholder.agePrimo': 56
	}
};
bogusData.NEWSLETTER = {
	...bogusData.CODEHOLDER,
};
bogusData.NEWSLETTER_MAGAZINE = {
	...bogusData.CODEHOLDER,

	'magazine.id': 3,
	'magazine.org': 'uea',
	'magazine.name': 'Esperanto',
	'magazine.description': 'Esperanto estas la **ĉefa** revuo de UEA.',
	'magazine.issn': '00140635',
	'magazine.magazineURL': 'https://uea.org/revuoj/revuo/3',

	'edition.id': 7,
	'edition.idHuman': 'julio-aŭgusto',
	'edition.date': '2021-07-01',
	'edition.thumbnailURL': 'https://uea.org/_/revuo/bildo?m=3&e=7&s=512px',
	'edition.description': null,
	'edition.editionURL': 'https://uea.org/revuoj/revuo/3/numero/7',

	'toc.md': '**Enhavtabelo**', // todo: these three
	'toc.html': { _akso_safeHtml: true, val: '<table><tr><td>Enhavtabelo</td></tr></table>' },
	'toc.text': 'Enhavtabelo',
};
bogusData.CONGRESS = {
	'registrationEntry.price': 10000,
	'registrationEntry.currency': 'EUR',
	'registrationEntry.sequenceId': 34,
	'registrationEntry.createdTime': 1667814523,
	'registrationEntry.canEdit': true,
	'registrationEntry.dataId': 'c1f05fd1b995c9f70f903064',
	'registrationEntry.dataKeys': [ 'nomo', 'retpoŝto', 'lando', 'donaco' ],
	'registrationEntry.dataMeta': [
		[ 'text', 'Nomo', 'text' ],
		[ 'text', 'Retpoŝtadreso', 'email' ],
		[ 'country', 'Loĝlando', null ],
		[ 'money', 'Donaco al la kongreso', 'EUR' ],
	],
	'registrationEntry.dataVals': [ 'Test McTest', 'example@example.com', 'fr', 1000 ],
};
bogusData.CONGRESS_REGISTRATION = {...bogusData.CONGRESS};
bogusData.VOTE_CAST_BALLOT = {
	...bogusData.CODEHOLDER,

	'vote.id': 3,
	'vote.org': 'uea',
	'vote.name': 'Elekto de Komitatanoj B',
	'vote.description': 'Venis la tempo por elekti niajn **Komitatanojn B**. *Voĉdonu nun!*',
	'vote.timeStart': 1667814523,
	'vote.timeEnd': 1667900923,
	'vote.hasStarted': true,
	'vote.ballotsSecret': true,
	'vote.type': 'tm',
	'vote.publishVoters': false,
	'vote.publishResults': true,
};

class AKSONotifTemplateIntent extends Enum {
	static getFormValues (prop) {
		return formValues[this.normalize(prop)];
	}

	static getBogusData (prop) {
		return bogusData[this.normalize(prop)];
	}
}
AKSONotifTemplateIntent.setProps(...Object.keys(formValues));

export default AKSONotifTemplateIntent;
