import path from 'path';
import crypto from 'pn/crypto';
import moment from 'moment-timezone';
import * as AddressFormat from '@cpsdqs/google-i18n-address';
import { base32 } from 'rfc4648';

import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';
import AKSOCurrency from 'akso/lib/enums/akso-currency';
import MembershipCategoryResource from 'akso/lib/resources/membership-category-resource';
import MagazineResource from 'akso/lib/resources/magazine-resource';

import { offersSchema, codeholderDataSchema } from './schema';

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
				type: 'boolean',
				default: false
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
		required: [
			'year',
			'currency',
			'offers',
			'codeholderData'
		],
		additionalProperties: false
	},
	requirePerms: [
		'codeholders.read',
	]
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Check perms
		let access = true;
		if (!req.hasPermission('registration.entries.create')) {
			const allCountries = await AKSO.db('countries')
				.select('code')
				.where('enabled', true)
				.pluck('code');

			access = allCountries
				.filter(x => req.hasPermission('registration.entries.intermediary.' + x));

			if (!access.length) {
				return res.sendStatus(403);
			}
		}

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

		// Validate the codeholder data
		let normalizedCodeholderAddress;
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

		// Make sure all membership categories exist
		const membershipIds = [];
		for (const offer of req.body.offers) {
			if (offer.type === 'membership') {
				membershipIds.push(offer.id);
			}
		}

		const membershipsArr = await AKSO.db('membershipCategories')
			.select('id', 'nameAbbrev', 'name', 'description', 'givesMembership', 'lifetime', 'availableFrom', 'availableTo')
			.whereIn('id', membershipIds);
		const membershipsObj = {};
		for (const membership of membershipsArr) {
			membershipsObj[membership.id] = (new MembershipCategoryResource(membership)).obj;
		}

		for (const id of membershipIds) {
			if (id in membershipsObj) { continue; }
			return res.type('text/plain').status(400)
				.send(`Unknown membership category ${id}`);
		}

		// Make sure all magazines exist
		const magazineIds = [];
		for (const offer of req.body.offers) {
			if (offer.type === 'magazine') {
				magazineIds.push(offer.id);
			}
		}

		const magazinesArr = await AKSO.db('magazines')
			.select('id', 'org', 'name', 'description', 'issn', 'subscribers')
			.whereIn('id', magazineIds);
		const magazinesObj = {};
		for (const magazine of magazinesArr) {
			magazine.subscriberFiltersCompiled = 1;
			const fakeReq = {
				query: {
					fields: [
						'id', 'org', 'name', 'description', 'issn', 'subscribers',
						'subscriberFiltersCompiled',
					],
				},
			};
			magazinesObj[magazine.id] = (new MagazineResource(magazine, fakeReq)).obj;
		}
		for (const id of magazineIds) {
			if (id in magazinesObj) { continue; }
			return res.type('text/plain').status(400)
				.send(`Unknown magazine ${id}`);
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

		// Start inserting
		const trx = await req.createTransaction();

		const registrationEntryId = await crypto.randomBytes(15);
		const data = {
			id: registrationEntryId,
			year: req.body.year,
			fishyIsOkay: req.body.fishyIsOkay,
			internalNotes: req.body.internalNotes,
			currency: req.body.currency,
			timeSubmitted: moment().unix(),
			intermediary: req.body.intermediary,
		};
		await trx('registration_entries').insert(data);

		if (typeof req.body.codeholderData === 'number') {
			await trx('registration_entries_codeholderData_id')
				.insert({
					registrationEntryId,
					codeholderId: req.body.codeholderData
				});
		} else if (typeof req.body.codeholderData === 'object') {
			await trx('registration_entries_codeholderData_obj')
				.insert({
					registrationEntryId,
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
				});
		}

		await trx('registration_entries_offers')
			.insert(req.body.offers.map((offer, arrayId) => {
				return {
					registrationEntryId,
					arrayId,
					type: offer.type,
					amount: offer.amount,
					membershipCategoryId: offer.type === 'membership' ? offer.id : undefined,
					membershipCategory: offer.type === 'membership' ? membershipsObj[offer.id]: undefined,
					magazineId: offer.type === 'magazine' ? offer.id : undefined,
					magazine: offer.type === 'magazine' ? magazinesObj[offer.id] : undefined,
					paperVersion: offer.type === 'magazine' ? (offer.paperVersion ?? false) : undefined,
				};
			}));

		await trx.commit();

		const idEncoded = base32.stringify(registrationEntryId);

		res.set('Location', path.join(AKSO.conf.http.path, 'registration/entries', idEncoded));
		res.set('X-Identifier', idEncoded);
		res.sendStatus(201);
	}
};
