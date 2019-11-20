import AddressFormat from 'google-i18n-address';
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';

import QueryUtil from 'akso/lib/query-util';
import SimpleResource from 'akso/lib/resources/simple-resource';

import parSchema from './schema';
import { memberFilter } from 'akso/workers/http/routing/codeholders/schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null
	}
};

const phoneUtil = PhoneNumberUtil.getInstance();
function formatPhoneNumber (number) {
	const numberObj = phoneUtil.parse(number);
	return phoneUtil.format(numberObj, PhoneNumberFormat.INTERNATIONAL);
}

export default {
	schema: schema,

	run: async function run (req, res) {
		if ('filter' in req.query) {
			return res.status(400).type('text/plain').send('?filter is not allowed');
		}
		if ('search' in req.query) {
			return res.status(400).type('text/plain').send('?search is not allowed');
		}
		if ('order' in req.query) {
			return res.status(400).type('text/plain').send('?order is not allowed');
		}

		const list = await AKSO.db('lists')
			.where('id', req.params.listId)
			.first('filters', 'memberFilter');

		if (!list) { return res.sendStatus(404); }

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
				memberFilter(schema, subQuery, reqData);
				QueryUtil.simpleCollection(reqData, schema, subQuery);
				delete subQuery._single.limit;
				return subQuery;
			});
		} catch (e) {
			e.statusCode = 500;
			throw e;
			// TODO: For some reason this try catch doesn't work at all
			// It's not that big of a deal considering that broken filters
			// should never make it into the db in the first place
			// But we should probably still try to fix this so we don't serve
			// 400s for no good reason in case something Does happen
		}

		const query = unionArr.splice(0, 1)[0];
		if (unionArr.length) {
			query
				.union(unionArr)
				.clearSelect();
			QueryUtil.simpleCollection({
				query: {
					limit: req.query.limit,
					offset: req.query.offset,
					fields: req.query.fields
				}
			}, schema, query);
		}

		const countryNames = [];
		(await AKSO.db('countries')
			.select('code', 'name_eo')
		).forEach(x => {
			countryNames[x.code] = x.name_eo;
		});

		const fields = req.query.fields || schema.defaultFields;
		const isMember = req.user ? await req.user.isActiveMember() : false;
		const col = (await query).map(obj => {
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
				if (obj.profilePicturePublicity === 'private' || (obj.profilePicturePublicity === 'members' && !isMember)) {
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

					obj.address = AddressFormat.formatAddress(
						addressObj,
						false,
						'eo',
						countryNames[addressObj.countryCode]
					);
				}
			}

			if (fields.includes('officePhoneFormatted')) {
				if (obj.officePhone) {
					obj.officePhoneFormatted = formatPhoneNumber(obj.officePhone);
				} else {
					obj.officePhoneFormatted = null;
				}
			}

			if (fields.includes('landlinePhoneFormatted')) {
				if (obj.landlinePhone) {
					obj.landlinePhoneFormatted = formatPhoneNumber(obj.landlinePhone);
				} else {
					obj.landlinePhoneFormatted = null;
				}
			}

			if (fields.includes('cellphoneFormatted')) {
				if (obj.cellphone) {
					obj.cellphoneFormatted = formatPhoneNumber(obj.cellphone);
				} else {
					obj.cellphoneFormatted = null;
				}
			}

			const res = new SimpleResource(obj);
			res.removeUnnecessary(fields);
			return res;
		});

		res.sendObj(col);
	}
};
