import { schema as parSchema } from 'akso/workers/http/routing/codeholders/schema';

export default {
	...parSchema,
	...{
		defaultFields: [ 'id' ],
		fields: {
			id: '',
			name: '',
			email: '',
			address: '',
			officePhone: '',
			officePhoneFormatted: '',
			landlinePhone: '',
			landlinePhoneFormatted: '',
			cellphone: '',
			cellphoneFormatted: '',
			biography: '',
			website: '',
			profilePictureHash: '',
		},
		fieldAliases: {
			name: () => AKSO.db.raw('1'),
			address: () => AKSO.db.raw('1'),
			'officePhoneFormatted': 'officePhone',
			'landlinePhoneFormatted': 'landlinePhone',
			'cellphoneFormatted': 'cellphone'
		},
		alwaysSelect: [
			'id',
			'firstName',
			'firstNameLegal',
			'lastName',
			'lastNameLegal',
			'honorific',
			'fullName',
			'fullNameLocal',
			'nameAbbrev',
			'careOf',
			'address_country',
			'address_countryArea',
			'address_city',
			'address_cityArea',
			'address_streetAddress',
			'address_postalCode',
			'address_sortingCode',
			'lastNamePublicity',
			'emailPublicity',
			'addressPublicity',
			'officePhonePublicity',
			'landlinePhonePublicity',
			'cellphonePublicity',
			'profilePicturePublicity',
			'codeholderType'
		]
	}
};
