import moment from 'moment-timezone';
import * as AddressFormat from '@cpsdqs/google-i18n-address';
import { bannedCodes } from '@tejo/akso-client';

import * as AKSONotif from 'akso/notif';
import * as AKSOMail from 'akso/mail';
import QueryUtil from 'akso/lib/query-util';

export const schema = {
	defaultFields: [ 'id' ],
	fields: {
		// Codeholder
		'id': 'f',
		'oldCode': 'f',
		'newCode': 'f',
		'codeholderType': 'f',
		'creationTime': 'f',
		'address.country': '',
		'address.countryArea': '',
		'address.city': '',
		'address.cityArea': '',
		'address.streetAddress': '',
		'address.postalCode': '',
		'address.sortingCode': '',
		'addressCountryGroups': 'f',
		'feeCountry': 'f',
		'feeCountryGroups': 'f',
		'addressLatin.country': 'f',
		'addressLatin.countryArea': 'fs',
		'addressLatin.city': 'fs',
		'addressLatin.cityArea': 'fs',
		'addressLatin.streetAddress': 'fs',
		'addressLatin.postalCode': 'fs',
		'addressLatin.sortingCode': 'fs',
		'addressPublicity': '',
		'searchAddress': 's',
		'email': 'fs',
		'emailPublicity': 'f',
		'notes': 'fs',
		'enabled': 'f',
		'officePhone': 's',
		'officePhoneFormatted': '',
		'officePhonePublicity': '',
		'isDead': 'f',
		'deathdate': 'f',
		'profilePictureHash': 'f',
		'profilePicturePublicity': '',
		'membership': '',
		'hasPassword': 'f',
		'isActiveMember': 'f',
		'searchName': 'fs',
		'website': '',
		'biography': '',
		'publicCountry': 'f',
		'publicEmail': 'fs',

		// HumanCodeholder
		'firstName': 'fs',
		'firstNameLegal': 'fs',
		'lastName': 'fs',
		'lastNameLegal': 'fs',
		'lastNamePublicity': '',
		'honorific': '',
		'birthdate': 'f',
		'age': 'f',
		'agePrimo': 'f',
		'profession': '',
		'landlinePhone': 's',
		'landlinePhoneFormatted': '',
		'landlinePhonePublicity': '',
		'cellphone': 's',
		'cellphoneFormatted': '',
		'cellphonePublicity': '',

		// OrgCodeholder
		'fullName': 'fs',
		'fullNameLocal': 'fs',
		'careOf': 'fs',
		'nameAbbrev': 'fs',
		'mainDescriptor': 's',
		'factoids': ''
	},
	fieldAliases: {
		'address.country': 'address_country',
		'address.countryArea': 'address_countryArea',
		'address.city': 'address_city',
		'address.cityArea': 'address_cityArea',
		'address.streetAddress': 'address_streetAddress',
		'address.postalCode': 'address_postalCode',
		'address.sortingCode': 'address_sortingCode',
		'addressLatin.country': 'address_country',
		'addressLatin.countryArea': 'address_countryArea_latin',
		'addressLatin.city': 'address_city_latin',
		'addressLatin.cityArea': 'address_cityArea_latin',
		'addressLatin.streetAddress': 'address_streetAddress_latin',
		'addressLatin.postalCode': 'address_postalCode_latin',
		'addressLatin.sortingCode': 'address_sortingCode_latin',
		'addressCountryGroups': () => AKSO.db.raw('(select group_concat(group_code) from countries_groups_members where countries_groups_members.country_code = view_codeholders.address_country)'),
		'feeCountryGroups': () => AKSO.db.raw('(select group_concat(group_code) from countries_groups_members where countries_groups_members.country_code = view_codeholders.feeCountry)'),
		'searchAddress': 'address_search',
		'searchName': () => AKSO.db.raw('COALESCE(searchNameHuman,searchNameOrg)'),
		'officePhoneFormatted': 'officePhone',
		'landlinePhoneFormatted': 'landlinePhone',
		'cellphoneFormatted': 'cellphone',
		'membership': () => AKSO.db.raw('1'),
		'hasPassword': () => AKSO.db.raw('`password` IS NOT NULL'),
		'isActiveMember': () => AKSO.db.raw(
			`enabled
			AND NOT isDead
			AND EXISTS(
				SELECT 1 from membershipCategories_codeholders
				LEFT JOIN membershipCategories
					ON membershipCategories_codeholders.categoryId = membershipCategories.id

				WHERE
					membershipCategories_codeholders.codeholderId = view_codeholders.id
					AND givesMembership
					AND (
						( NOT lifetime AND membershipCategories_codeholders.year = year(curdate()) )
						OR ( lifetime AND membershipCategories_codeholders.year <= year(curdate()) )
					)
			)`)
	},
	fieldSearchGroups: [],
	customSearch: {
		searchName: match => AKSO.db.raw(
			`IF(codeholderType = "human",
				${match('searchNameHuman')},
				${match('searchNameOrg')}
			)`)
	},
	alwaysSelect: [
		'id',
		'codeholderType',
		'addressCountryGroups',
		'feeCountryGroups'
	],
	customFilterCompOps: {
		$hasAny: {
			addressCountryGroups: (query, arr) => {
				query.whereExists(function () {
					this.select(1).from('countries_groups_members')
						.whereRaw('`countries_groups_members`.`country_code` = `view_codeholders`.`address_country`')
						.whereIn('countries_groups_members.group_code', arr);
				});
			},
			feeCountryGroups: (query, arr) => {
				query.whereExists(function () {
					this.select(1).from('countries_groups_members')
						.whereRaw('`countries_groups_members`.`country_code` = `view_codeholders`.`address_country`')
						.whereIn('countries_groups_members.group_code', arr);
				});
			}
		}
	},
	customFilterLogicOpsFields: { // TODO: What is this even used for, I cannot find any reference to it when searching through src
		$membership: 'membership',
		$roles: 'roles'
	},
	customFilterLogicOps: {
		$membership: ({ query, filter } = {}) => {
			if (typeof filter !== 'object' || filter === null || Array.isArray(filter)) {
				const err = new Error('$membership expects an object');
				err.statusCode = 400;
				throw err;
			}
			query.whereExists(function () {
				this.select(1)
					.from('membershipCategories_codeholders')
					.innerJoin('membershipCategories', 'membershipCategories.id', 'membershipCategories_codeholders.categoryId')
					.whereRaw('`codeholderId` = `view_codeholders`.`id`');

				QueryUtil.filter({
					fields: [
						'categoryId',
						'givesMembership',
						'lifetime',
						'year',
						'canuto'
					],
					query: this,
					filter
				});
			});
		},
		$roles: ({ query, filter } = {}) => {
			if (typeof filter !== 'object' || filter === null || Array.isArray(filter)) {
				const err = new Error('$roles expects an object');
				err.statusCode = 400;
				throw err;
			}
			query.whereExists(function () {
				this.select(1)
					.from('codeholderRoles_codeholders')
					.innerJoin('codeholderRoles', 'codeholderRoles.id', 'codeholderRoles_codeholders.roleId')
					.whereRaw('codeholderId = view_codeholders.id');

				QueryUtil.filter({
					fields: [
						'roleId',
						'durationFrom',
						'durationTo',
						'isActive'
					],
					fieldAliases: {
						isActive: () => AKSO.db.raw(`
							(
								durationFrom IS NULL
								OR durationFrom <= UNIX_TIMESTAMP()
							)
							AND
							(
								durationTo IS NULL
								OR durationTO > UNIX_TIMESTAMP()
							)
						`)
					},
					query: this,
					filter
				});
			});
		}
	}
};

const validFields = Object.keys(schema.fields).concat([
	'files', 'logins', 'roles', 'profilePicture'
]);
export const memberRestrictionFields = [...new Set(
	validFields.flatMap(f => {
		const bits = f.split('.');
		const arr = [];
		for (let i = 0; i < bits.length; i++) {
			arr.push(bits.slice(0, i + 1).join('.'));
		}
		return arr;
	}))];

export function memberFilter (schema, query, req) {
	QueryUtil.filter({
		fields: Object.keys(schema.fields)
			.filter(x => schema.fields[x].includes('f')),
		query,
		filter: req.memberFilter,
		fieldAliases: schema.fieldAliases
	});
}

export function memberFields (defaultFields, req, res, flag, memberFields) {
	const fields = req.query.fields || schema.defaultFields;

	const haveFlag = memberFieldsManual(fields, req, flag, memberFields);
	if (!haveFlag) {
		res.status(403).type('text/plain').send('Illegal codeholder fields used, check /perms');
	}

	return haveFlag;
}

export function memberFieldMatches (fields, req, flags, memberFields) {
	if (memberFields === undefined) { memberFields = req.memberFields; }
	if (req.memberFields === null) { return fields; }

	const haveFlag = fields
		.filter(f => {
			const flagsFull = memberFields[f];
			const flagsSplit = memberFields[f.split('.')[0]];

			let flagsJoined = '';
			if (flagsFull) { flagsJoined += flagsFull; }
			if (flagsSplit) { flagsJoined += flagsSplit; }

			for (const flag of flags) {
				if (flagsJoined.includes(flag)) {
					return true;
				}
			}
			return false;
		});
	return haveFlag;
}

export function memberFieldsManual (fields, req, flags, memberFields) {
	const haveFlag = memberFieldMatches(fields, req, flags, memberFields);
	for (const field of fields) {
		if (!haveFlag.includes(field)) {
			return false;
		}
	}
	return true;
}

export async function afterQuery (arr, done) {
	if (!arr.length || !arr[0].membership) { return done(); }

	const codeholders = {};
	const ids = arr.map(x => {
		codeholders[x.id] = x;
		x.membership = [];
		return x.id;
	});
	// See: https://stackoverflow.com/a/47696704/1248084
	// Obtains the two most relevant membership entries for the codeholder
	const memberships = await AKSO.db.raw(`
		SELECT
		    \`categoryId\`,
		    \`codeholderId\`,
		    \`year\`,
		    \`nameAbbrev\`,
		    \`name\`,
		    \`lifetime\`,
		    \`givesMembership\`

			FROM (
			    SELECT
		        	*,
		            (@rn := if(@prev = codeholderId, @rn + 1, 1)) AS rn,
		            @prev := codeholderId

		        FROM (
		            SELECT
		                \`categoryId\`,
		                \`codeholderId\`,
		                \`year\`,
		                \`nameAbbrev\`,
		                \`name\`,
		                \`lifetime\`,
		    			\`givesMembership\`
		            
		            FROM membershipCategories_codeholders

		            INNER JOIN membershipCategories
		                ON membershipCategories.id = membershipCategories_codeholders.categoryId

		            WHERE
		            	\`codeholderId\` IN (${ids.map(() => '?').join(',')}) AND
		                \`year\` <= YEAR(CURDATE())

		            ORDER BY
		                codeholderId,
		                \`lifetime\` desc,
		                \`year\` desc
		            
		        ) AS \`sortedTable\`
		        
		        JOIN (SELECT @prev := NULL, @rn := 0) AS \`vars\`
			    
			) AS \`groupedTable\`
		    
		    WHERE rn <= 2
	`,

	ids
	);

	for (let membership of memberships[0]) {
		codeholders[membership.codeholderId].membership.push({
			categoryId: membership.categoryId,
			year: membership.year,
			nameAbbrev: membership.nameAbbrev,
			name: membership.name,
			lifetime: !!membership.lifetime,
			givesMembership: !!membership.givesMembership
		});
	}
	

	done();
}

export const profilePictureSizes = [
	32, 64, 128, 256, 512
];

export const histFields = {
	// Codeholder
	'newCode': 'newCode',
	'password': '',
	'address': [
		'address.country',
		'address.countryArea',
		'addressLatin.countryArea',
		'address.city',
		'addressLatin.city',
		'address.cityArea',
		'addressLatin.cityArea',
		'address.streetAddress',
		'addressLatin.streetAddress',
		'address.postalCode',
		'addressLatin.postalCode',
		'address.sortingCode',
		'addressLatin.sortingCode'
	],
	'addressPublicity': 'addressPublicity',
	'feeCountry': 'feeCountry',
	'email': 'email',
	'emailPublicity': 'emailPublicity',
	'enabled': 'enabled',
	'notes': 'notes',
	'officePhone': 'officePhone',
	'officePhonePublicity': 'officePhonePublicity',
	'isDead': 'isDead',
	'deathdate': 'deathdate',
	'profilePictureHash': 'profilePictureHash',
	'profilePicturePublicity': 'profilePicturePublicity',
	'website': 'website',
	'biography': 'biography',
	'profession': 'profession',
	'publicCountry': 'publicCountry',
	'publicEmail': 'publicEmail',

	// HumanCodeholder
	'firstName': 'firstName',
	'firstNameLegal': 'firstNameLegal',
	'lastName': 'lastName',
	'lastNameLegal': 'lastNameLegal',
	'lastNamePublicity': 'lastNamePublicity',
	'honorific': 'honorific',
	'birthdate': 'birthdate',
	'landlinePhone': 'landlinePhone',
	'landlinePhonePublicity': 'landlinePhonePublicity',
	'cellphone': 'cellphone',
	'cellphonePublicity': 'cellphonePublicity',

	// OrgCodeholder
	'fullName': 'fullName',
	'fullNameLocal': 'fullNameLocal',
	'careOf': 'careOf',
	'nameAbbrev': 'nameAbbrev',
	'mainDescriptor': 'mainDescriptor',
	'factoids': 'factoids'
};
for (let field in histFields) {
	if (Array.isArray(histFields[field])) { continue; }
	histFields[field] = [ histFields[field] ].filter(x => x.length);
}

export const patchSchema = {
	type: 'object',
	properties: {
		// Codeholder
		newCode: {
			type: 'string',
			pattern: '^[a-z]{6}$'
		},
		address: {
			type: 'object',
			properties: {
				country: {
					type: 'string',
					pattern: '^[a-z]{2}$'
				},
				countryArea: {
					type: 'string',
					pattern: '^[^\\n]{1,50}$',
					nullable: true
				},
				city: {
					type: 'string',
					pattern: '^[^\\n]{1,50}$',
					nullable: true
				},
				cityArea: {
					type: 'string',
					pattern: '^[^\\n]{1,50}$',
					nullable: true
				},
				streetAddress: {
					type: 'string',
					minLength: 1,
					maxLength: 100,
					nullable: true
				},
				postalCode: {
					type: 'string',
					pattern: '^[^\\n]{1,20}$',
					nullable: true
				},
				sortingCode: {
					type: 'string',
					pattern: '^[^\\n]{1,20}$',
					nullable: true
				}
			},
			additionalProperties: false,
			required: [ 'country' ]
		},
		addressPublicity: {
			type: 'string',
			enum: [ 'private', 'public', 'members' ]
		},
		feeCountry: {
			type: 'string',
			pattern: '^[a-z]{2}$'
		},
		publicCountry: {
			type: 'string',
			pattern: '^[a-z]{2}$',
			nullable: true
		},
		email: {
			type: 'string',
			format: 'email',
			minLength: 3,
			maxLength: 200,
			nullable: true
		},
		publicEmail: {
			type: 'string',
			format: 'email',
			minLength: 3,
			maxLength: 200,
			nullable: true
		},
		emailPublicity: {
			type: 'string',
			enum: [ 'private', 'public', 'members' ]
		},
		enabled: {
			type: 'boolean'
		},
		notes: {
			type: 'string',
			minLength: 1,
			maxLength: 10000,
			nullable: true
		},
		officePhone: {
			type: 'string',
			format: 'tel',
			nullable: true
		},
		officePhonePublicity: {
			type: 'string',
			enum: [ 'private', 'public', 'members' ]
		},
		isDead: {
			type: 'boolean'
		},
		deathdate: {
			type: 'string',
			format: 'date',
			nullable: true
		},
		profilePicturePublicity: {
			type: 'string',
			enum: [ 'public', 'members' ]
		},
		website: {
			type: 'string',
			format: 'safe-uri',
			nullable: true,
			maxLength: 50
		},
		biography: {
			type: 'string',
			minLength: 1,
			maxLength: 2000,
			nullable: true
		},

		// HumanCodeholder
		firstName: {
			type: 'string',
			pattern: '^[^\\n]{1,50}$',
			nullable: true
		},
		firstNameLegal: {
			type: 'string',
			pattern: '^[^\\n]{1,50}$'
		},
		lastName: {
			type: 'string',
			pattern: '^[^\\n]{1,50}$',
			nullable: true
		},
		lastNameLegal: {
			type: 'string',
			pattern: '^[^\\n]{1,50}$',
			nullable: true
		},
		lastNamePublicity: {
			type: 'string',
			enum: [ 'private', 'public', 'members' ]
		},
		honorific: {
			type: 'string',
			pattern: '^[^\\n]{2,15}$',
			nullable: true
		},
		birthdate: {
			type: 'string',
			format: 'date',
			nullable: true,
			validateFunction: val => !(moment(val).isAfter(moment()))
		},
		profession: {
			type: 'string',
			pattern: '^[^\\n]{1,50}$',
			nullable: true
		},
		landlinePhone: {
			type: 'string',
			format: 'tel',
			nullable: true
		},
		landlinePhonePublicity: {
			type: 'string',
			enum: [ 'private', 'public', 'members' ]
		},
		cellphone: {
			type: 'string',
			format: 'tel',
			nullable: true
		},
		cellphonePublicity: {
			type: 'string',
			enum: [ 'private', 'public', 'members' ]
		},

		// OrgCodeholder
		fullName: {
			type: 'string',
			pattern: '^[^\\n]{1,100}$'
		},
		fullNameLocal: {
			type: 'string',
			pattern: '^[^\\n]{1,100}$',
			nullable: true
		},
		careOf: {
			type: 'string',
			pattern: '^[^\\n]{1,100}$',
			nullable: true
		},
		nameAbbrev: {
			type: 'string',
			pattern: '^[^\\n]{1,12}$',
			nullable: true
		},
		mainDescriptor: {
			type: 'string',
			pattern: '^[^\\n]{1,30}$',
			nullable: true
		},
		factoids: {
			type: 'object',
			minProperties: 1,
			maxProperties: 15,
			additionalProperties: false,
			patternProperties: {
				'^[^\\n]{1,30}$': {
					oneOf: [
						'tel', 'text', 'number', 'email', 'url'
					].map(type => {
						let valObj;
						switch (type) {
						case 'tel':
							valObj = {
								type: 'string',
								format: 'tel',
								maxLength: 250
							};
							break;
						case 'text':
							valObj = {
								type: 'string',
								maxLength: 250
							};
							break;
						case 'number':
							valObj = {
								type: 'number'
							};
							break;
						case 'email':
							valObj = {
								type: 'string',
								format: 'email',
								maxLength: 250
							};
							break;
						case 'url':
							valObj = {
								type: 'string',
								format: 'safe-uri',
								maxLength: 250
							};
						}


						return {
							type: 'object',
							additionalProperties: false,
							properties: {
								val: valObj,
								type: {
									type: 'string',
									const: type
								}
							},
							required: [ 'val', 'type' ]
						};
					})
				}
			}
		}
	},
	additionalProperties: false,
	minProperties: 1
};

export const exclusiveFields = {
	human: [
		'firstName',
		'firstNameLegal',
		'lastName',
		'lastNameLegal',
		'lastNamePublicity',
		'honorific',
		'birthdate',
		'profession',
		'landlinePhone',
		'landlinePhonePublicity',
		'cellphone',
		'cellphonePublicity'
	],
	org: [
		'fullName',
		'fullNameLocal',
		'careOf',
		'nameAbbrev',
		'mainDescriptor',
		'factoids'
	]
};
exclusiveFields.all = Object.values(exclusiveFields).reduce((a, b) => a.concat(b));

export async function validatePatchFields (req, res, codeholderBefore) {
	const updateData = {};
	let addressUpdateData = null;

	for (const field of Object.keys(req.body)) {
		if (field === 'address') {
			// Make sure the country exists
			const addressCountry = await AKSO.db('countries')
				.where({ enabled: true, code: req.body.address.country })
				.first('name_eo');
			if (!addressCountry) {
				return res.status(400).type('text/plain').send('Unknown address.country');
			}

			const addressInput = {...req.body.address};
			addressInput.countryCode = req.body.address.country;
			delete addressInput.country;
			let addressNormalized;
			try {
				addressNormalized = await AddressFormat.normalizeAddress(addressInput);
			} catch (e) {
				if (e instanceof AddressFormat.InvalidAddress) {
					return res.status(400).type('text/plain').send('Invalid address: ' + JSON.stringify(e.errors));
				}
				throw e;
			}
			const addressLatin = await AddressFormat.latinizeAddress(addressNormalized);

			const addressSearch = [
				addressLatin.countryCode,
				addressCountry.name_eo,
				addressNormalized.countryArea,
				addressLatin.countryArea,
				addressLatin.city,
				addressLatin.cityArea,
				addressLatin.streetAddress,
				addressLatin.postalCode,
				addressLatin.sortingCode
			]
				.filter(val => val) // remove null/undefined
				.join(' ');

			addressUpdateData = {
				...addressNormalized,
				...{
					codeholderId: req.params.codeholderId,
					search: addressSearch
				}
			};
			for (let [key, val] of Object.entries(addressLatin)) {
				addressUpdateData[key + '_latin'] = val;
			}
			addressUpdateData.country = req.body.address.country;
			delete addressUpdateData.countryCode;
			delete addressUpdateData.countryCode_latin;

			// Set feeCountry to address.country if null
			if (codeholderBefore.feeCountry === null && !req.body.feeCountry) {
				updateData.feeCountry = req.body.feeCountry = req.body.address.country;
			}
		} else {
			if (field === 'feeCountry') {
				// Make sure the country exists
				const feeCountryFound = await AKSO.db('countries')
					.where({ enabled: true, code: req.body.feeCountry })
					.first(1);
				if (!feeCountryFound) {
					return res.status(400).type('text/plain').send('Unknown feeCountry');
				}
			} else if (field === 'publicCountry' && req.body.publicCountry !== null) {
				// Make sure the country exists
				const publicCountryFound = await AKSO.db('countries')
					.where({ enabled: true, code: req.body.publicCountry })
					.first(1);
				if (!publicCountryFound) {
					return res.status(400).type('text/plain').send('Unknown publicCountry');
				}
			} else if (field === 'email' && req.body.email !== null) {
				// Make sure the email isn't taken
				const emailTaken = await AKSO.db('codeholders')
					.where('email', req.body.email)
					.first(1);
				if (emailTaken) {
					return res.status(400).type('text/plain').send('email taken');
				}
			} else if (field === 'newCode') {
				// Make sure the newCode isn't taken
				const newCodeTaken = await AKSO.db('codeholders')
					.where('newCode', req.body.newCode)
					.first(1);
				if (newCodeTaken) {
					return res.status(400).type('text/plain').send('newCode taken');
				}

				// Make sure newCode isn't banned
				for (const bannedCode of bannedCodes) {
					if (req.body.newCode.includes(bannedCode)) {
						return res.status(400).type('text/plain').send('newCode is banned');
					}
				}
			} else if (field === 'deathdate') {
				// Make sure it's not greater than the current date
				if (moment(req.body.deathdate).isAfter(moment(), 'day')) {
					return res.status(400).type('text/plain').send('deathdate is in the future');
				}
			} else if (field === 'isDead') {
				// Set deathdate to current date if true, null if false assuming it's not manually set
				if (req.body.isDead) {
					if (!req.body.deathdate && !codeholderBefore.deathdate) {
						updateData.deathdate = req.body.deathdate = moment().format('YYYY-MM-DD');
					}
				} else {
					updateData.deathdate = req.body.deathdate = null;
				}
			} else if (field === 'factoids' && req.body.factoids !== null) {
				updateData.factoids = req.body.factoids = JSON.stringify(req.body.factoids);
			}

			updateData[field] = req.body[field];
		}
	}

	return {
		updateData,
		addressUpdateData
	};
}

export async function handleHistory ({
	req, cmtType, oldData, oldAddress,
	validationData, codeholderId, fields,
	approverUser = null, db = AKSO.db
} = {}) {
	let cmt = '';
	if (cmtType === 'modCmt') {
		cmt = req.query.modCmt;
	} else if (cmtType === 'modDesc') {
		cmt = AKSO.CODEHOLDER_OWN_CHANGE_CMT;
	} else if (cmtType === 'modDescApproved') {
		cmt = await AKSO.CODEHOLDER_OWN_CHANGE_APPROVED_CMT(approverUser);
	}

	const histPromises = [];
	for (let field of fields) {
		let histEntry = {
			codeholderId: codeholderId,
			modTime: moment().unix(),
			modBy: req.user.modBy,
			modCmt: cmt
		};
		if (field === 'address') {
			const oldAddressWithPrefixes = {};
			for (let key in oldAddress) {
				if (key === 'codeholderId') { continue; }
				oldAddressWithPrefixes['address_' + key] = oldAddress[key];
			}
			histEntry = {...histEntry, ...oldAddressWithPrefixes};
		} else if (field === 'factoids' && oldData[field] !== null) {
			histEntry[field] = JSON.stringify(oldData[field]);
		} else {
			histEntry[field] = oldData[field];
		}

		const table = 'codeholders_hist_' + field;
		const histQuery = db(table).insert(histEntry);
		histPromises.push(histQuery);

		if (field === 'email' && cmtType === 'modCmt') {
			const view = {
				emailFrom: oldData.email || '-nenio-',
				emailTo: validationData.updateData.email || '-nenio-',
				note: cmt
			};
			// Send to old
			if (oldData.email !== null) {
				const to = (await AKSOMail.getNamesAndEmails(codeholderId))[0];
				to.email = oldData.email;
				const personalization = {
					to: to,
					substitutions: {
						name: to.name
					}
				};
				histPromises.push(AKSOMail.renderSendEmail({
					org: 'uea',
					tmpl: 'email-changed-admin',
					view: view,
					personalizations: [ personalization ]
				}));
			}
			// Send to new
			histPromises.push(AKSONotif.sendNotification({
				codeholderIds: [ codeholderId ],
				org: 'uea',
				notif: 'email-changed-admin',
				category: 'account',
				view: view
			}));
		}
	}
	await Promise.all(histPromises);
}
