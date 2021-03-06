import moment from 'moment-timezone';

export const schema = {
	defaultFields: [ 'id' ],
	fields: {
		id: 'f',
		year: 'f',
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
		codeholderData: ''
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

export async function afterQuery (arr, done) {
	if (!arr.length) { return done(); }

	const ids = arr.map(row => row.id);

	if (arr[0].offers) {
		// Obtain registration entry offers
		const offers = await AKSO.db('registration_entries_offers')
			.whereIn('registrationEntryId', ids)
			.orderBy('registrationEntryId', 'arrayId')
			.select('registrationEntryId', 'type', 'amount',
				AKSO.db.raw('COALESCE(`membershipCategoryId`) AS `id`'));

		const offersById = {};
		for (const offer of offers) {
			const hex = offer.registrationEntryId.toString('hex');
			if (!(hex in offersById)) {
				offersById[hex] = [];
			}

			offersById[hex].push({
				type: offer.type,
				amount: offer.amount,
				id: offer.id
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
