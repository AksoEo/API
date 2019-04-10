import QueryUtil from '../../lib/query-util';
import CodeholderResource from '../../lib/resources/codeholder-resource';
import SimpleCollection from '../../lib/simple-collection';

const schema = {
	query: 'collection',
	defaultFields: [ 'id' ],
	fields: {
		// Codeholder
		'id': 'f',
		'oldCode': 'f',
		'newCode': 'f',
		'codeholderType': 'f',
		'address.country': '',
		'address.countryArea': '',
		'address.city': '',
		'address.cityArea': '',
		'address.streetAddress': '',
		'address.postalCode': '',
		'feeCountry': 'f',
		'addressLatin.country': 'f',
		'addressLatin.countryArea': 'fs',
		'addressLatin.city': 'fs',
		'addressLatin.cityArea': 'fs',
		'addressLatin.streetAddress': 'fs',
		'addressLatin.postalCode': 'fs',
		'email': 'fs',
		'notes': 'fs',
		'enabled': 'f',
		'officePhone': 's',
		'officePhoneFormatted': '',
		'isDead': 'f',

		// HumanCodeholder
		'firstName': 'f',
		'firstNameLegal': 'f',
		'lastName': 'f',
		'lastNameLegal': 'f',
		'honorific': '',
		'birthdate': 'f',
		'age': 'f',
		'agePrimo': 'f',
		'profession': '',
		'landlinePhone': 's',
		'landlinePhoneFormatted': '',
		'cellphone': 's',
		'cellphoneFormatted': '',

		// OrgCodeholder
		'fullName': 'f',
		'fullNameLocal': 'f',
		'careOf': 'fs',
		'nameAbbrev': 'f'
	},
	fieldAliases: {
		'address.country': 'address_country',
		'address.countryArea': 'address_countryArea',
		'address.city': 'address_city',
		'address.cityArea': 'address_cityArea',
		'address.streetAddress': 'address_streetAddress',
		'address.postalCode': 'address_postalCode',
		'addressLatin.country': 'address_country',
		'addressLatin.countryArea': 'address_countryArea_latin',
		'addressLatin.city': 'address_city_latin',
		'addressLatin.cityArea': 'address_cityArea_latin',
		'addressLatin.streetAddress': 'address_streetAddress_latin',
		'addressLatin.postalCode': 'address_postalCode_latin',
		'officePhoneFormatted': 'officePhone',
		'landlinePhoneFormatted': 'landlinePhone',
		'cellphoneFormatted': 'cellphone'
	},
	fieldSearchGroups: [
		'firstName,firstNameLegal,lastName,lastNameLegal',
		'fullName,fullNameLocal,nameAbbrev'
	],
	alwaysSelect: [
		'codeholderType'
	],
	body: null,
	requirePerms: 'codeholders.read'
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('view_codeholders');
		await QueryUtil.handleCollection(req, res, schema, query, CodeholderResource, SimpleCollection, [[ req ]]);
	}
};
