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
		'nameAbbrev': 'fs'
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
						'year'
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

export function memberFilter (schema, query, req) {
	QueryUtil.filter({
		fields: Object.keys(schema.fields)
			.filter(x => schema.fields[x].indexOf('f' > -1)),
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

export function memberFieldsManual (fields, req, flag, memberFields) {
	if (memberFields === undefined) { memberFields = req.memberFields; }
	if (req.memberFields === null) { return true; }

	const haveFlag = fields
		.map(f => f.split('.')[0])
		.map(f => {
			if (!(f in memberFields)) { return false; }
			return memberFields[f].indexOf(flag) > -1;
		})
		.reduce((a, b) => a && b);

	return haveFlag;
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
	'nameAbbrev': 'nameAbbrev'
};
for (let field in histFields) {
	if (Array.isArray(histFields[field])) { continue; }
	histFields[field] = [ histFields[field] ].filter(x => x.length);
}
