import Enum from './enum';

import { UnionType, ConcreteType } from '@tejo/akso-script';

const formValues = {
	CODEHOLDER: {
		'codeholder.id': new ConcreteType(ConcreteType.types.NUMBER),
		'codeholder.name': new ConcreteType(ConcreteType.types.STRING),
		'codeholder.oldCode': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.STRING)
		]),
		'codeholder.newCode': new ConcreteType(ConcreteType.types.STRING),
		'codeholder.codeholderType': new ConcreteType(ConcreteType.types.STRING),
		'codeholder.hasPassword': new ConcreteType(ConcreteType.types.BOOL),
		'codeholder.addressFormatted': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.STRING)
		]),
		'codeholder.addressLatin.country': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.STRING)
		]),
		'codeholder.addressLatin.countryArea': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.STRING)
		]),
		'codeholder.addressLatin.cityArea': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.STRING)
		]),
		'codeholder.addressLatin.streetAddress': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.STRING)
		]),
		'codeholder.addressLatin.postalCode': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.STRING)
		]),
		'codeholder.addressLatin.sortingCode': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.STRING)
		]),
		'codeholder.feeCountry': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.STRING)
		]),
		'codeholder.email': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.STRING)
		]),
		'codeholder.birthdate': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.STRING)
		]),
		'codeholder.cellphone': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.STRING)
		]),
		'codeholder.officePhone': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.STRING)
		]),
		'codeholder.landlinePhone': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.STRING)
		]),
		'codeholder.age': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.NUMBER)
		]),
		'codeholder.agePrimo': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.NUMBER)
		])
	}
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
`Bjalistokostrato 42
2020 Bjalistoko
POLLANDO`,
		'codeholder.addressLatin.country': 'pl',
		'codeholder.addressLatin.countryArea': null,
		'codeholder.addressLatin.city': 'Bjalistoko',
		'codeholder.addressLatin.cityArea': null,
		'codeholder.addressLatin.streetAddress': 'Bjalistokostrato 42',
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

class AKSOEmailTemplateIntent extends Enum {
	static getFormValues (prop) {
		return formValues[this.normalize(prop)];
	}

	static getBogusData (prop) {
		return bogusData[this.normalize(prop)];
	}
}
AKSOEmailTemplateIntent.setProps(...Object.keys(formValues));

export default AKSOEmailTemplateIntent;
