import * as AddressFormat from '@cpsdqs/google-i18n-address';

import { schema as parSchema, memberFilter, memberFieldsManual } from 'akso/workers/http/routing/codeholders/schema';

const schema = {
	...parSchema,
	...{
		query: [ 'formatAs' ],
		body: null,
		requirePerms: 'codeholders.read'
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

		const latin = (req.query.formatAs === 'displayLatin' || req.query.formatAs === 'postalLatin');

		// Try to find the codeholders
		const codeholderIds = req.params.codeholderIds.split(',');
		const codeholderQuery = AKSO.db('view_codeholders')
			.whereIn('id', codeholderIds)
			.select([
				'id',
				'address_country',
				'address_countryArea',
				'address_city',
				'address_cityArea',
				'address_streetAddress',
				'address_postalCode',
				'address_sortingCode',
				'honorific',
				'firstNameLegal',
				'lastNameLegal',
				'fullName',
				'fullNameLocal',
				'careOf'
			]);
		memberFilter(schema, codeholderQuery, req);

		// Restrictions
		const requiredMemberFields = [
			'address',
			'honorific',
			'firstNameLegal',
			'lastNameLegal',
			'fullName',
			'fullNameLocal',
			'careOf'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'r')) {
			return res.status(403).type('text/plain').send('Missing permitted address codeholder fields, check /perms');
		}

		const codeholders = await codeholderQuery;

		const addresses = {};

		for (let codeholder of codeholders) {
			// Check if we have an address
			if (!codeholder.address_country) {
				addresses[codeholder.id] = null;
				continue;
			}

			const addressObj = {
				countryCode: 	codeholder.address_country,
				countryArea: 	codeholder.address_countryArea,
				city: 			codeholder.address_city,
				cityArea: 		codeholder.address_cityArea,
				streetAddress: 	codeholder.address_streetAddress,
				postalCode: 	codeholder.address_postalCode,
				sortingCode: 	codeholder.address_sortingCode,
				name: ''
			};

			if (req.query.formatAs === 'postal' || req.query.formatAs === 'postalLatin') {
				if (codeholder.honorific) {
					addressObj.name += codeholder.honorific + ' ';
				}
				if (codeholder.firstNameLegal) {
					addressObj.name += codeholder.firstNameLegal;
				}
				if (codeholder.lastNameLegal) {
					addressObj.name += ' ' + codeholder.lastNameLegal;
				}

				addressObj.companyName = codeholder.fullNameLocal || codeholder.fullName;
				if (codeholder.careOf) {
					addressObj.companyName += `\nc/o ${codeholder.careOf}`;
				}
			}

			// Obtain the country name
			const countryData = await AKSO.db('countries')
				.first('name_' + req.params.language)
				.where('code', codeholder.address_country);
			const countryName = countryData['name_' + req.params.language];

			addresses[codeholder.id] = await AddressFormat.formatAddress(
				addressObj,
				latin,
				req.params.language,
				countryName
			);
		}

		res.sendObj(addresses);
	}
};
