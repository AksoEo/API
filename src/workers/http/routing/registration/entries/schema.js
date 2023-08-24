import moment from 'moment-timezone';

export const schema = {
	defaultFields: [ 'id' ],
	fields: {
		id: 'f',
		year: 'f',
		intermediary: 'f',
		status: 'f',
		'pendingIssue.what': '',
		'pendingIssue.where': '',
		fishyIsOkay: '',
		newCodeholderId: 'f',
		timeSubmitted: 'f',
		timeStatus: 'f',
		internalNotes: 's',
		currency: 'f',
		offers: '',
		codeholderData: '',
	},
	fieldAliases: {
		'pendingIssue.what': 'pendingIssue_what',
		'pendingIssue.where': 'pendingIssue_where',
		offers: () => AKSO.db.raw('1'),
		codeholderData: () => AKSO.db.raw('1')
	},
	alwaysSelect: [ 'id' ],
	customFilterLogicOps: {
		$codeholderData: ({ query, filter } = {}) => {
			if (Number.isSafeInteger(filter)) {
				// search by id
				query.whereExists(function () {
					this.select(1)
						.from('registration_entries_codeholderData_id')
						.whereRaw('`registration_entries_codeholderData_id`.`registrationEntryId` = `id`')
						.where('registration_entries_codeholderData_id.codeholderId', filter);
				});

			} else if (typeof filter === 'object' && filter !== null && !Array.isArray(filter)) {
				// search by object
				const allowedFields = [ 'address.country', 'feeCountry', 'email', 'birthdate' ];
				const data = {};
				for (const field in filter) {
					if (!allowedFields.includes(field)) {
						const err = new Error(`Illegal field ${field} used in $codeholderData object`);
						err.statusCode = 400;
						throw err;
					}
					switch (field) {
					case 'address.country': data.address_country = filter['address.country']; break;
					default: data[field] = filter[field];
					}
				}

				query.whereExists(function () {
					this.select(1)
						.from('registration_entries_codeholderData_obj')
						.whereRaw('`registration_entries_codeholderData_obj`.`registrationEntryId` = `id`')
						.where(data);
				});

			} else {
				const err = new Error('$codeholderData expects an integer or an object');
				err.statusCode = 400;
				throw err;
			}
		}
	}
};

export const codeholderDataSchema = {
	oneOf: [
		{
			type: 'number',
			format: 'uint32'
		},
		{
			type: 'object',
			properties: {
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
					required: [ 'country' ],
					additionalProperties: false
				},
				feeCountry: {
					type: 'string',
					pattern: '^[a-z]{2}$'
				},
				email: {
					type: 'string',
					format: 'email',
					minLength: 3,
					maxLength: 200
				},
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
				honorific: {
					type: 'string',
					pattern: '^[^\\n]{2,25}$',
					nullable: true
				},
				birthdate: {
					type: 'string',
					format: 'date',
					validateFunction: val => !(moment(val).isAfter(moment()))
				},
				cellphone: {
					type: 'string',
					format: 'tel',
					nullable: true
				}
			},
			required: [
				'address',
				'feeCountry',
				'email',
				'firstNameLegal',
				'birthdate'
			],
			additionalProperties: false
		}
	]
};

export const offersSchema = {
	type: 'array',
	minItems: 1,
	maxItems: 127,
	items: {
		oneOf: [
			{
				properties: {
					type: {
						type: 'string',
						enum: [ 'membership' ]
					},
					id: {
						type: 'number',
						format: 'uint32'
					},
					amount: {
						type: 'number',
						format: 'uint32'
					}
				},
				required: [
					'type', 'id', 'amount'
				],
			},
			{
				properties: {
					type: {
						type: 'string',
						enum: [ 'magazine' ]
					},
					id: {
						type: 'number',
						format: 'uint32'
					},
					amount: {
						type: 'number',
						format: 'uint32'
					},
					paperVersion: {
						type: 'boolean'
					}
				},
				required: [
					'type', 'id', 'amount'
				],
			}
		].map(x => {
			return {
				type: 'object',
				additionalProperties: false,
				...x
			};
		})
	}
};

export async function afterQuery (arr, done) {
	if (!arr.length) { return done(); }

	const ids = arr.map(row => row.id);

	if (arr[0].offers) {
		// Obtain registration entry offers
		const offers = await AKSO.db('registration_entries_offers')
			.whereIn('registrationEntryId', ids)
			.orderBy('registrationEntryId', 'arrayId')
			.select(
				'registrationEntryId', 'type', 'amount', 'paperVersion', 'membershipCategory', 'magazine',
				AKSO.db.raw('IF(`type`="membership", `membershipCategoryId`, `magazineId`) AS `id`'));

		const offersById = {};
		for (const offer of offers) {
			const hex = offer.registrationEntryId.toString('hex');
			if (!(hex in offersById)) {
				offersById[hex] = [];
			}

			offersById[hex].push({
				type: offer.type,
				amount: offer.amount,
				id: offer.id,
				paperVersion: offer.type === 'magazine' ? !!offer.paperVersion : undefined,
				magazine: offer.type === 'magazine' ? offer.magazine : undefined,
				membershipCategory: offer.type === 'membership' ? offer.membershipCategory : undefined,
			});
		}

		for (const row of arr) {
			row.offers = offersById[row.id.toString('hex')] || [];
		}
	}

	if (arr[0].codeholderData) {
		// Obtain registration entry codeholder data

		// Obtain existing codeholder ids where present
		const codeholderIds = await AKSO.db('registration_entries_codeholderData_id')
			.whereIn('registrationEntryId', ids)
			.select('registrationEntryId', 'codeholderId');

		const codeholderIdByRegistrationEntryId = {};
		for (const row of codeholderIds) {
			codeholderIdByRegistrationEntryId[row.registrationEntryId.toString('hex')] = row.codeholderId;
		}

		// Obtain codeholder data obj where present
		const codeholderDataObjs = await AKSO.db('registration_entries_codeholderData_obj')
			.whereIn('registrationEntryId', ids)
			.select('*');

		const codeholderObjByRegistrationEntryId = {};
		for (const row of codeholderDataObjs) {
			codeholderObjByRegistrationEntryId[row.registrationEntryId.toString('hex')] = {
				address: {
					country: row.address_country,
					countryArea: row.address_countryArea,
					city: row.address_city,
					cityArea: row.address_cityArea,
					streetAddress: row.address_streetAddress,
					postalCode: row.address_postalCode,
					sortingCode: row.address_sortingCode
				},
				feeCountry: row.feeCountry,
				email: row.email,
				firstName: row.firstName,
				firstNameLegal: row.firstNameLegal,
				lastName: row.lastName,
				lastNameLegal: row.lastNameLegal,
				honorific: row.honorific,
				birthdate: moment(row.birthdate).format('Y-MM-DD'),
				cellphone: row.cellphone
			};
		}

		// Set codeholderData
		for (const row of arr) {
			const hex = row.id.toString('hex');

			row.codeholderData = codeholderIdByRegistrationEntryId[hex]
				|| codeholderObjByRegistrationEntryId[hex]
				|| null; // should never happen
		}
	}

	done();
}
