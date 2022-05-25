import Enum from './enum';

import { union, NULL, STRING, NUMBER, BOOL } from '@tejo/akso-script';

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
