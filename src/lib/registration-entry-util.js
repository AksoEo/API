import { UEACode } from '@tejo/akso-client';
import moment from 'moment-timezone';
import { base32 } from 'rfc4648';
import crypto from 'pn/crypto';
import * as AddressFormat from '@cpsdqs/google-i18n-address';

import { createTransaction } from 'akso/util';
import { sendNotification } from 'akso/notif';

export async function handlePaidRegistrationEntry (registrationEntryId, db = undefined) {
	let selfCommitTrx = false;
	if (!db) {
		// Ensure trx
		selfCommitTrx = true;
		db = await createTransaction();
	}

	// First, we need to auto-update its status
	const issue = await checkIssuesInPaidRegistrationEntry(registrationEntryId, db);

	// Assuming nothing went wrong, fulfill the registration
	let isExistingCodeholder,
		codeholderId,
		newCodeholderData,
		newUEACode;
	if (!issue) {
		const existingCodeholderData = await AKSO.db('registration_entries_codeholderData_id')
			.where('registrationEntryId', registrationEntryId)
			.first('codeholderId');

		isExistingCodeholder = true;
		newCodeholderData = null;
		if (!existingCodeholderData) {
			isExistingCodeholder = false;
			newCodeholderData = await AKSO.db('registration_entries_codeholderData_obj')
				.where('registrationEntryId', registrationEntryId)
				.first('*');
		}

		if (!isExistingCodeholder && !newCodeholderData) {
			throw new Error(`Registration entry ${registrationEntryId.toString('hex')} has neither codeholder id nor codeholder data obj`);
			// This should absolutely never be able to happen
		}

		if (isExistingCodeholder) {
			codeholderId = existingCodeholderData.codeholderId;
		} else {
			// Determine a new UEA code
			const firstNames = [
				newCodeholderData.firstName,
				newCodeholderData.firstNameLegal
			].filter(x => !!x);
			const lastNames = [
				newCodeholderData.lastName,
				newCodeholderData.lastNameLegal
			].filter(x => !!x);

			const suggestedUEACodes = UEACode.suggestCodes({
				type: 'human',
				firstNames: firstNames,
				lastNames: lastNames
			});

			if (!suggestedUEACodes.length) {
				throw new Error(`No suggested UEA code found for registration entry ${registrationEntryId.toString('hex')}`);
				// The probability of this happening is extremely small, but we should probably still have some logic in place to deal with it
				// TODO: Do something here
			}

			const takenUEACodes = (
				await AKSO.db('codeholders')
					.select('newCode')
					.whereIn('newCode', suggestedUEACodes)
			).map(x => x.newCode);

			const availableUEACodes = suggestedUEACodes
				.filter(x => !takenUEACodes.includes(x));

			if (!availableUEACodes.length) {
				throw new Error(`No available UEA code found for registration entry ${registrationEntryId.toString('hex')}`);
				// The probability of this happening is extremely small, but we should probably still have some logic in place to deal with it
				// TODO: Do something here
			}

			newUEACode = availableUEACodes[0];

			const now = moment();
			const codeholderData = {
				codeholderType: 'human',
				creationTime: now.unix(),
				newCode: newUEACode,
				email: newCodeholderData.email,
				feeCountry: newCodeholderData.feeCountry,
				notes: AKSO.CODEHOLDER_CREATED_BY_REGISTRATION(
					now.format('YYYY-MM-DD HH:mm:ss [UTC]'),
					base32.stringify(registrationEntryId)
				)
			};
			const humanCodeholderData = {
				firstName: newCodeholderData.firstName,
				firstNameLegal: newCodeholderData.firstNameLegal,
				lastName: newCodeholderData.lastName,
				lastNameLegal: newCodeholderData.lastNameLegal,
				honorific: newCodeholderData.honorific,
				birthdate: newCodeholderData.birthdate,
				cellphone: newCodeholderData.cellphone
			};

			let addressCodeholderData = {
				country: newCodeholderData.address_country,
				countryArea: newCodeholderData.address_countryArea,
				city: newCodeholderData.address_city,
				cityArea: newCodeholderData.address_cityArea,
				streetAddress: newCodeholderData.address_streetAddress,
				postalCode: newCodeholderData.address_postalCode,
				sortingCode: newCodeholderData.address_sortingCode
			};

			const addressInput = {...addressCodeholderData};
			addressInput.countryCode = addressInput.country;
			delete addressInput.country;
			// This might error, but as all addresses in the db are already vetted, this should not happen
			const latinizedCodeholderAddress = await AddressFormat.latinizeAddress(addressInput);

			addressCodeholderData = {
				...addressCodeholderData,
				countryArea_latin: latinizedCodeholderAddress.countryArea,
				city_latin: latinizedCodeholderAddress.city,
				cityArea_latin: latinizedCodeholderAddress.cityArea,
				streetAddress_latin: latinizedCodeholderAddress.streetAddress,
				postalCode_latin: latinizedCodeholderAddress.postalCode,
				sortingCode_latin: latinizedCodeholderAddress.sortingCode
			};

			const addressCountry = await db('countries')
				.where({ enabled: true, code: addressCodeholderData.country })
				.first('name_eo');

			addressCodeholderData.search = [
				latinizedCodeholderAddress.countryCode,
				addressCountry.name_eo,
				addressCodeholderData.countryArea,
				latinizedCodeholderAddress.countryArea,
				latinizedCodeholderAddress.city,
				latinizedCodeholderAddress.cityArea,
				latinizedCodeholderAddress.streetAddress,
				latinizedCodeholderAddress.postalCode,
				latinizedCodeholderAddress.sortingCode
			]
				.filter(val => val) // remove null/undefined
				.join(' ');

			// Create a new codeholder
			try {
				codeholderId = (await db('codeholders').insert(codeholderData))[0];
				humanCodeholderData.codeholderId = codeholderId;
				addressCodeholderData.codeholderId = codeholderId;

				await db('codeholders_human').insert(humanCodeholderData);
				await db('codeholders_address').insert(addressCodeholderData);
			} catch (e) {
				AKSO.log.error(`An error occured when processing registration entry ${registrationEntryId.toString('hex')}`);
				throw new Error(e);
			}
		}

		const registrationEntry = await AKSO.db('registration_entries')
			.where('id', registrationEntryId)
			.first('year');

		// Give the offers
		const offers = await AKSO.db('registration_entries_offers')
			.where('registrationEntryId', registrationEntryId)
			.select('type', 'membershipCategoryId', 'magazineId', 'paperVersion');

		const membershipInsert = [];
		const magazineInsert = [];
		for (const offer of offers) {
			if (offer.type === 'membership') {
				membershipInsert.push({
					year: registrationEntry.year,
					categoryId: offer.membershipCategoryId,
					codeholderId,
				});
			} else if (offer.type === 'magazine') {
				magazineInsert.push({
					id: await crypto.randomBytes(15),
					magazineId: offer.magazineId,
					year: registrationEntry.year,
					codeholderId,
					createdTime: moment().unix(),
					paperVersion: offer.paperVersion,
				});
			}
		}
		if (membershipInsert.length) {
			await db('membershipCategories_codeholders')
				.insert(membershipInsert);
		}
		if (magazineInsert.length) {
			await db('magazines_subscriptions')
				.insert(magazineInsert);
		}

		// Update the registration entry status to succeeded
		await db('registration_entries')
			.where('id', registrationEntryId)
			.update({
				status: 'succeeded',
				timeStatus: moment().unix(),
				newCodeholderId: isExistingCodeholder ? null : codeholderId,
				pendingIssue_what: null,
				pendingIssue_where: null
			});

	}

	if (selfCommitTrx) { await db.commit(); }

	if (!issue && !isExistingCodeholder) {
		// Send welcome notif to the new codeholder
		await sendNotification({
			codeholderIds: [ codeholderId ],
			org: 'uea',
			notif: 'new-member-welcome',
			category: 'account',
			view: {
				isTEJO: moment(newCodeholderData.birthdate, 'YYYY-MM-DD')
					.month(1).date(1)
					.diff(moment(), 'years') * -1 <= 35, // now > then
				newCode: newUEACode,
			},
			db,
		});
	}
}

export async function checkIssuesInPaidRegistrationEntry (registrationEntryId, db = AKSO.db) {
	const updateRegistrationEntry = updateData => {
		return db('registration_entries')
			.where('id', registrationEntryId)
			.update({
				timeStatus: moment().unix(),
				...updateData
			});
	};

	// Obtain codeholder data
	const existingCodeholderData = await db('registration_entries_codeholderData_id')
		.where('registrationEntryId', registrationEntryId)
		.first('codeholderId');

	let isExistingCodeholder = true;
	let newCodeholderData = null;
	if (!existingCodeholderData) {
		isExistingCodeholder = false;
		newCodeholderData = await db('registration_entries_codeholderData_obj')
			.where('registrationEntryId', registrationEntryId)
			.first('*');
	}

	if (!isExistingCodeholder && !newCodeholderData) {
		throw new Error('Registration Entry has no codeholder id or data obj');
		// This should absolutely never be able to happen
		// TODO: Report error
	}

	const registrationEntry = await db('registration_entries')
		.where('id', registrationEntryId)
		.first('*');

	if (isExistingCodeholder) {
		// Check for offer issues
		const offers = await db('registration_entries_offers')
			.where('registrationEntryId', registrationEntryId)
			.select('*');

		const membershipOffers = offers
			.filter(x => x.type === 'membership');
		if (membershipOffers.length) {
			// Check if the codeholder already has any of the membership offers
			const duplicateMembership = await db('membershipCategories_codeholders')
				.where({
					codeholderId: existingCodeholderData.codeholderId,
					year: registrationEntry.year
				})
				.whereIn('categoryId', membershipOffers.map(x => x.membershipCategoryId))
				.first('categoryId');

			if (duplicateMembership) {
				// Find the arrayId of the duplicate offer
				let arrayId;
				for (const membershipOffer of offers) {
					arrayId = membershipOffer.arrayId;
					if (membershipOffer.membershipCategoryId === duplicateMembership.categoryId) {
						break;
					}
				}

				const updateData = {
					status: 'pending',
					pendingIssue_what: 'duplicate_offer',
					pendingIssue_where: `offer[${arrayId}]`
				};
				await updateRegistrationEntry(updateData);
				return updateData;
			}
		}

		const magazineOffers = offers
			.filter(x => x.type === 'magazine');
		if (magazineOffers.length) {
			// Check if the codeholder already has any of the magazine offers
			const duplicateMagazineSubscription = await db('magazines_subscriptions')
				.where({
					codeholderId: existingCodeholderData.codeholderId,
					year: registrationEntry.year,
				})
				.where(function () {
					for (const offer of magazineOffers) {
						this.orWhere({
							magazineId: offer.magazineId,
							paperVersion: offer.paperVersion,
						});
					}
				})
				.first('magazineId', 'paperVersion');

			if (duplicateMagazineSubscription) {
				// Find the arrayId of the duplicate offer
				let arrayId;
				for (const magazineSubscriptionOffer of offers) {
					if (magazineSubscriptionOffer.magazineId !== duplicateMagazineSubscription.magazineId) {
						continue;
					}
					// soft compare because of a lack of type-casting num to bool
					if (magazineSubscriptionOffer.paperVersion != duplicateMagazineSubscription.paperVersion) {
						continue;
					}
					arrayId = magazineSubscriptionOffer.arrayId;
				}

				const updateData = {
					status: 'pending',
					pendingIssue_what: 'duplicate_offer',
					pendingIssue_where: `offer[${arrayId}]`
				};
				await updateRegistrationEntry(updateData);
				return updateData;
			}
		}

	} else {
		// Check for codeholder data issues
		const issueEmail = await db('view_codeholders')
			.first(1)
			.where('email', newCodeholderData.email);
		if (issueEmail) {
			const updateData = {
				status: 'pending',
				pendingIssue_what: 'duplicate_data',
				pendingIssue_where: 'codeholderData.email'
			};
			await updateRegistrationEntry(updateData);
			return updateData;
		}

		if (!registrationEntry.fishyIsOkay) {
			const issueAddressAndName = await db('view_codeholders')
				.first(1)
				.where({
					firstNameLegal: newCodeholderData.firstNameLegal,
					lastNameLegal: newCodeholderData.lastNameLegal,
					address_country: newCodeholderData.address_country,
					address_countryArea: newCodeholderData.address_countryArea,
					address_city: newCodeholderData.address_city,
					address_cityArea: newCodeholderData.address_cityArea,
					address_streetAddress: newCodeholderData.address_streetAddress,
					address_postalCode: newCodeholderData.address_postalCode,
					address_sortingCode: newCodeholderData.address_sortingCode
				});
			if (issueAddressAndName) {
				const updateData = {
					status: 'pending',
					pendingIssue_what: 'fishy_data',
					pendingIssue_where: 'codeholderData.addressAndName'
				};
				await updateRegistrationEntry(updateData);
				return updateData;
			}

			if (newCodeholderData.feeCountry !== newCodeholderData.address_country) {
				const updateData = {
					status: 'pending',
					pendingIssue_what: 'fishy_data',
					pendingIssue_where: 'codeholderData.addressAndFeeCountries'
				};
				await updateRegistrationEntry(updateData);
				return updateData;
			}
		}
	}

	return null;
}
