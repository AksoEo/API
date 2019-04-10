import AddressFormat from 'google-i18n-address';

import { schema as parSchema, memberFilter, memberFieldsManual } from '../../../schema';

const schema = {
	...parSchema,
	...{
		query: [ 'formatAs' ],
		body: null,
		requirePerms: 'log.read'
	}
};

const languages = [
	'eo', 'en', 'fr', 'es',
	'nl', 'pt', 'sk', 'zh',
	'de'
];

const formatAsOptions = [
	'display', 'displayLatin', 'postal', 'postalLatin'
];

export default {
	schema: schema,

	run: async function run (req, res, next) {
		// Validate the language
		if (languages.indexOf(req.params.language) === -1) {
			return res.sendStatus(404);
		}

		// Validate ?formatAs
		let formatAs = 'displayLatin';
		if (req.query.formatAs) {
			formatAs = req.query.formatAs;
			if (formatAsOptions.indexOf(formatAs) === -1) {
				const err = new Error('Invalid value in ?formatAs');
				err.statusCode = 400;
				return next(err);
			}
		}

		// Try to find the codeholder
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first([
				'address_country',
				'address_countryArea',
				'address_city',
				'address_cityArea',
				'address_streetAddress',
				'address_postalCode',
				'firstNameLegal',
				'lastNameLegal',
				'fullName',
				'fullNameLocal',
				'careOf'
			]);

		// Restrictions
		memberFilter(schema, codeholderQuery, req);
		const requiredMemberFields = [
			'address.country',
			'address.countryArea',
			'address.city',
			'address.cityArea',
			'address.streetAddress',
			'address.postalCode',
			'firstNameLegal',
			'lastNameLegal',
			'fullName',
			'fullNameLocal',
			'careOf'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'r')) {
			return res.status(401).send('Missing permitted address codeholder fields, check /perms');
		}

		const codeholder = await codeholderQuery;
		if (!codeholder) { return res.sendStatus(404); }

		// Check if we have an address
		if (!codeholder.address_country) {
			return res.sendObj({ address: null });
		}

		// Obtain the country name
		const countryData = await AKSO.db('countries')
			.first('name_' + req.params.language)
			.where('code', codeholder.address_country);
		const countryName = countryData['name_' + req.params.language];

		const addressObj = {
			countryCode: 	codeholder.address_country,
			countryArea: 	codeholder.address_countryArea,
			city: 			codeholder.address_city,
			cityArea: 		codeholder.address_cityArea,
			streetAddress: 	codeholder.address_streetAddress,
			postalCode: 	codeholder.address_postalCode
		};

		const latin = (req.query.formatAs === 'displayLatin' || req.query.formatAs === 'postalLatin');

		if (req.query.formatAs === 'postal' || req.query.formatAs === 'postalLatin') {
			if (codeholder.firstNameLegal) {
				addressObj.name = codeholder.firstNameLegal;
			}
			if (codeholder.lastNameLegal) {
				addressObj.name += ' ' + codeholder.lastNameLegal;
			}
			if (codeholder.careOf) {
				addressObj.name = `c/o ${codeholder.careOf}`;
			}
			addressObj.companyName = codeholder.fullNameLocal || codeholder.fullName;
		}

		return res.sendObj({
			address: AddressFormat.formatAddress(
				addressObj,
				latin,
				req.params.language,
				countryName
			)
		});
	}
};
