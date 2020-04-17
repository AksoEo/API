import { schema as parSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

import * as AddressFormat from '@cpsdqs/google-i18n-address';
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';
import { default as deepmerge } from 'deepmerge';

import QueryUtil from 'akso/lib/query-util';
import SimpleResource from 'akso/lib/resources/simple-resource';

export const schema = {
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
			'officePhoneFormatted': () => AKSO.db.raw('1'),
			'landlinePhoneFormatted': () => AKSO.db.raw('1'),
			'cellphoneFormatted': () => AKSO.db.raw('1')
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
			'officePhone',
			'officePhonePublicity',
			'landlinePhone',
			'landlinePhonePublicity',
			'cellphone',
			'cellphonePublicity',
			'profilePicturePublicity',
			'codeholderType'
		]
	}
};

const combSchemas = {
	...schema,
	fields: deepmerge.all([ parSchema.fields, schema.fields ]),
	fieldAliases: deepmerge.all([ parSchema.fieldAliases, schema.fieldAliases ])
};

const phoneUtil = PhoneNumberUtil.getInstance();
function formatPhoneNumber (number) {
	const numberObj = phoneUtil.parse(number);
	return phoneUtil.format(numberObj, PhoneNumberFormat.INTERNATIONAL);
}

export async function getCodeholderQuery (listId, req) {
	const list = await AKSO.db('lists')
		.where('id', listId)
		.first('filters', 'memberFilter');

	if (!list) {
		const e = new Error();
		e.statusCode = 404;
		throw e;
	}

	const parsedFilters = list.filters.map(JSON.parse);
	let unionArr;
	try {
		unionArr = parsedFilters.map(filter => {
			const reqData = {
				memberFilter: list.memberFilter,
				query: {
					filter: filter,
					fields: req.query.fields
				}
			};

			const subQuery = AKSO.db('view_codeholders');
			memberFilter(combSchemas, subQuery, reqData);
			QueryUtil.simpleCollection(reqData, combSchemas, subQuery);
			subQuery.toSQL();
			delete subQuery._single.limit;
			return subQuery;
		});
	} catch (e) {
		e.statusCode = 500;
		throw e;
	}

	const query = unionArr.splice(0, 1)[0];
	if (unionArr.length) { query.union(unionArr); }
	query.clearSelect();
	const reqQuery = {
		offset: req.query.offset,
		fields: req.query.fields
	};
	if ('limit' in req.query) { reqQuery.limit = req.query.limit; }
	QueryUtil.simpleCollection({
		query: reqQuery
	}, schema, query);


	return { query: query };
}

export async function handleCodeholders (req, codeholders) {
	const countryNames = [];
	(await AKSO.db('countries')
		.select('code', 'name_eo')
	).forEach(x => {
		countryNames[x.code] = x.name_eo;
	});

	const fields = req.query.fields || schema.defaultFields;
	const isMember = req.user ? await req.user.isActiveMember() : false;
	const col = await Promise.all(codeholders.map(async obj => {
		if (obj.name) {
			const nameBits = [];
			if (obj.codeholderType === 'human') {
				if (obj.honorific) { nameBits.push(obj.honorific); }
				nameBits.push(obj.firstName || obj.firstNameLegal);
				if (obj.lastNamePublicity === 'public' || (obj.lastNamePublicity === 'members' && isMember)) {
					nameBits.push(obj.lastName || obj.lastNameLegal);
				}
			} else if (obj.codeholderType === 'org') {
				nameBits.push(obj.fullName);
				if (obj.nameAbbrev) { nameBits.push(`(${obj.nameAbbrev})`); }
			}
			obj.name = nameBits.join(' ');
		}

		if (obj.email) {
			if (obj.emailPublicity === 'private' || (obj.emailPublicity === 'members' && !isMember)) {
				obj.email = null;
			}
		}

		if (obj.profilePictureHash) {
			if (obj.profilePicturePublicity === 'members' && !isMember) {
				obj.profilePictureHash = null;
			}
		}

		if (obj.address) {
			if (obj.addressPublicity === 'private' || (obj.addressPublicity === 'members' && !isMember) || obj.address_country === null) {
				obj.address = null;
			} else {
				const addressObj = {
					countryCode: 	obj.address_country,
					countryArea: 	obj.address_countryArea,
					city: 			obj.address_city,
					cityArea: 		obj.address_cityArea,
					streetAddress: 	obj.address_streetAddress,
					postalCode: 	obj.address_postalCode,
					sortingCode: 	obj.address_sortingCode
				};

				if (obj.codeholderType === 'org') {
					addressObj.companyName = obj.fullNameLocal || obj.fullName;
					if (obj.careOf) {
						addressObj.companyName += `\nc/o ${obj.careOf}`;
					}
				}

				obj.address = await AddressFormat.formatAddress(
					addressObj,
					false,
					'eo',
					countryNames[addressObj.countryCode]
				);
			}
		}

		if (obj.officePhonePublicity === 'public' || (obj.officePhonePublicity === 'members' && isMember)) {
			if (fields.includes('officePhoneFormatted')) {
				obj.officePhoneFormatted = obj.officePhone ? formatPhoneNumber(obj.officePhone) : null;
			}
		} else {
			obj.officePhone = obj.officePhoneFormatted = null;
		}

		if (obj.codeholderType === 'human') {
			if (obj.landlinePhonePublicity === 'public' || (obj.landlinePhonePublicity === 'members' && isMember)) {
				if (fields.includes('landlinePhoneFormatted')) {
					obj.landlinePhoneFormatted = obj.landlinePhone ? formatPhoneNumber(obj.landlinePhone) : null;
				}
			} else {
				obj.landlinePhone = obj.landlinePhoneFormatted = null;
			}

			if (obj.cellphonePublicity === 'public' || (obj.cellphonePublicity === 'members' && isMember)) {
				if (fields.includes('cellphoneFormatted')) {
					obj.cellphoneFormatted = obj.cellphone ? formatPhoneNumber(obj.cellphone) : null;
				}
			} else {
				obj.cellphone = obj.cellphoneFormatted = null;
			}
		} else {
			delete obj.landlinePhone;
			delete obj.landlinePhoneFormatted;
			delete obj.cellphone;
			delete obj.cellphoneFormatted;
		}

		const res = new SimpleResource(obj);
		res.removeUnnecessary(fields);
		return res;
	}));

	return col;
}

export async function getCodeholdersFromList (listId, req) {
	const query = (await getCodeholderQuery(listId, req)).query;
	return await handleCodeholders(req, await query);
}
