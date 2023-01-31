import * as AddressFormat from '@cpsdqs/google-i18n-address';

import { insertAsReplace } from 'akso/util';
import AKSOCurrency from 'akso/lib/enums/akso-currency';
import { checkIssuesInPaidRegistrationEntry } from 'akso/lib/registration-entry-util';
import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

import { offersSchema, codeholderDataSchema } from '../schema';

const schema = {
	query: null,
	body: {
		type: 'object',
		properties: {
			year: {
				type: 'number',
				format: 'year',
			},
			intermediary: {
				type: 'string',
				minLength: 2,
				maxLength: 2,
				nullable: true,
			},
			fishyIsOkay: {
				type: 'boolean'
			},
			internalNotes: {
				type: 'string',
				nullable: true,
				minLength: 1,
				maxLength: 4000
			},
			currency: {
				type: 'string',
				enum: AKSOCurrency.all
			},
			offers: offersSchema,
			codeholderData: codeholderDataSchema,
		},
		minProperties: 1,
		additionalProperties: false
	},
	requirePerms: [
		'codeholders.read',
	],
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Make sure the registration entry exists
		const registrationEntry = await AKSO.db('registration_entries')
			.where('id', req.params.registrationEntryId)
			.first('status', 'intermediary');
		if (!registrationEntry) {
			return res.sendStatus(404);
		}

		// Check perms
		let access = true;
		if (!req.hasPermission('registration.entries.update')) {
			const allCountries = await AKSO.db('countries')
				.select('code')
				.where('enabled', true)
				.pluck('code');

			access = allCountries
				.filter(x => req.hasPermission('registration.entries.intermediary.' + x));

			if (!access.includes(registrationEntry.intermediary)) {
				return res.sendStatus(403);
			}
		}

		if (registrationEntry.status !== 'submitted') {
			const keys = Object.keys(req.body);
			const permittedKeys = [ 'internalNotes', 'fishyIsOkay', 'codeholderData' ];
			for (const key of keys) {
				if (!permittedKeys.includes(key)) {
					return res.type('text/plain').status(400)
						.send(`The field ${req.body.year} may not be patched when status is not submitted`);
				}
			}
		}

		// TODO: All of this verification is duplicate code from POST
		// This should be moved to the registration entry util lib eventually

		if (req.body.year) {
			// Make sure registration is enabled for the given year
			const registrationOptions = await AKSO.db('registration_options')
				.first('paymentOrgId')
				.where({
					enabled: true,
					year: req.body.year
				});
			if (!registrationOptions) {
				return res.type('text/plain').status(400)
					.send(`Registration is not enabled for year ${req.body.year}`);
			}
		}

		let normalizedCodeholderAddress;
		if ('codeholderData' in req.body) {
			// Validate the codeholder data
			if (typeof req.body.codeholderData === 'number') {
				// Ensure the codeholder is human and enabled and does in fact exist
				const codeholderExistsQuery = AKSO.db('view_codeholders')
					.where({
						enabled: true,
						id: req.body.codeholderData,
						codeholderType: 'human'
					})
					.first(1);
				memberFilter(codeholderSchema, codeholderExistsQuery, req);
				if (!await codeholderExistsQuery) {
					return res.type('text/plain').status(400)
						.send(`Could not find an enabled, human codeholder with id ${req.body.codeholderData}`);
				}
			} else if (typeof req.body.codeholderData === 'object') {
				const addressCountryExists = await AKSO.db('countries')
					.where({ enabled: true, code: req.body.codeholderData.address.country })
					.first(1);
				if (!addressCountryExists) {
					return res.type('text/plain').status(400)
						.send(`Unknown country ${req.body.codeholderData.address.country}`);
				}

				const feeCountryExists = await AKSO.db('countries')
					.where({ enabled: true, code: req.body.codeholderData.feeCountry })
					.first(1);
				if (!feeCountryExists) {
					return res.type('text/plain').status(400)
						.send(`Unknown country ${req.body.codeholderData.feeCountry}`);
				}

				const addressInput = {...req.body.codeholderData.address};
				addressInput.countryCode = req.body.codeholderData.address.country;
				delete addressInput.country;
				try {
					normalizedCodeholderAddress = await AddressFormat.normalizeAddress(addressInput);
				} catch (e) {
					if (e instanceof AddressFormat.InvalidAddress) {
						return res.status(400).type('text/plain')
							.send('Invalid address: ' + JSON.stringify(e.errors));
					}
					throw e;
				}
			}
		}

		if (req.body.offers) {
			// Make sure all membership categories exist
			const membershipIds = [];
			for (const offer of req.body.offers) {
				if (offer.type === 'membership') {
					membershipIds.push(offer.id);
				}
			}

			const membershipsExisting = await AKSO.db('membershipCategories')
				.select('id')
				.whereIn('id', membershipIds)
				.pluck('id');
			for (const id of membershipIds) {
				if (membershipsExisting.includes(id)) { continue; }
				return res.type('text/plain').status(400)
					.send(`Unknown membership category ${id}`);
			}

			// Make sure all magazines exist
			const magazineIds = [];
			for (const offer of req.body.offers) {
				if (offer.type === 'magazine') {
					membershipIds.push(offer.id);
				}
			}

			const magazinesExisting = await AKSO.db('magazines')
				.select('id')
				.whereIn('id', magazineIds)
				.pluck('id');
			for (const id of magazineIds) {
				if (magazinesExisting.includes(id)) { continue; }
				return res.type('text/plain').status(400)
					.send(`Unknown magazine ${id}`);
			}
		}

		// Make sure the intermediary country code is valid
		if (req.body.intermediary) {
			const countryExists = await AKSO.db('countries')
				.first(1)
				.where({
					code: req.body.intermediary,
					enabled: true,
				});
			if (!countryExists) {
				return res.type('text/plain').status(400)
					.send(`Unknown intermediary country ${req.body.intermediary}`);
			}
			if (access !== true && !access.includes(req.body.intermediary)) {
				return res.type('text/plain').status(400)
					.send(`Illegal country ${req.body.intermediary} used in field intermediary`);
			}
		}
		if (access !== true && !req.body.intermediary) {
			return res.type('text/plain').status(400)
				.send('intermediary cannot be null when the perm registration.entries.create is not granted');
		}

		// Start updating
		const trx = await req.createTransaction();

		const data = {
			year: req.body.year,
			fishyIsOkay: req.body.fishyIsOkay,
			internalNotes: req.body.internalNotes,
			currency: req.body.currency,
			intermediary: req.body.intermediary,
		};
		const dataValueCount = Object.values(data)
			.filter(val => val !== undefined)
			.length;

		if (dataValueCount) {
			await trx('registration_entries')
				.where('id', req.params.registrationEntryId)
				.update(data);
		}

		if (typeof req.body.codeholderData === 'number') {
			await insertAsReplace(
				trx('registration_entries_codeholderData_id')
					.insert({
						registrationEntryId: req.params.registrationEntryId,
						codeholderId: req.body.codeholderData
					}),
				trx
			);
			await trx('registration_entries_codeholderData_obj')
				.where('registrationEntryId', req.params.registrationEntryId)
				.delete();
		} else if (typeof req.body.codeholderData === 'object') {
			await insertAsReplace(
				trx('registration_entries_codeholderData_obj')
					.insert({
						registrationEntryId: req.params.registrationEntryId,
						address_country: req.body.codeholderData.address.country,
						address_countryArea: normalizedCodeholderAddress.countryArea,
						address_city: normalizedCodeholderAddress.city,
						address_cityArea: normalizedCodeholderAddress.cityArea,
						address_streetAddress: normalizedCodeholderAddress.streetAddress,
						address_postalCode: normalizedCodeholderAddress.postalCode,
						address_sortingCode: normalizedCodeholderAddress.sortingCode,
						feeCountry: req.body.codeholderData.feeCountry,
						email: req.body.codeholderData.email,
						firstName: req.body.codeholderData.firstName,
						firstNameLegal: req.body.codeholderData.firstNameLegal,
						lastName: req.body.codeholderData.lastName,
						lastNameLegal: req.body.codeholderData.lastNameLegal,
						honorific: req.body.codeholderData.honorific,
						birthdate: req.body.codeholderData.birthdate,
						cellphone: req.body.codeholderData.cellphone,
					}),
				trx
			);
			await trx('registration_entries_codeholderData_id')
				.where('registrationEntryId', req.params.registrationEntryId)
				.delete();
		}

		if (req.body.offers) {
			await trx('registration_entries_offers')
				.where('registrationEntryId', req.params.registrationEntryId)
				.delete();

			await trx('registration_entries_offers')
				.insert(req.body.offers.map((offer, arrayId) => {
					return {
						registrationEntryId: req.params.registrationEntryId,
						arrayId,
						type: offer.type,
						amount: offer.amount,
						membershipCategoryId: offer.type === 'membership' ? offer.id : undefined,
						magazineId: offer.type === 'magazine' ? offer.id : undefined,
						paperVersion: offer.type === 'magazine' ? offer.paperVersion : undefined,
					};
				}));
		}

		// Update the status of the registration entry if needed
		if (registrationEntry.status === 'pending') {
			const issue = await checkIssuesInPaidRegistrationEntry(req.params.registrationEntryId, trx);
			if (!issue) {
				// Set the status to processing so the worker will rerun it
				await trx('registration_entries')
					.where('id', req.params.registrationEntryId)
					.update({
						status: 'processing',
						pendingIssue_what: null,
						pendingIssue_where: null
					});
			}
		}

		await trx.commit();

		res.sendStatus(204);
	}
};
