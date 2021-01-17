import moment from 'moment-timezone';
import * as AddressFormat from '@cpsdqs/google-i18n-address';

import { createTransaction, insertAsReplace } from 'akso/util';
import AKSOCurrency from 'akso/lib/enums/akso-currency';

const schema = {
	query: null,
	body: {
		type: 'object',
		properties: {
			year: {
				type: 'number',
				format: 'year',
				validateFunction: function (val) {
					return val >= (new Date()).getFullYear();
				}
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
			offers: {
				type: 'array',
				minItems: 1,
				maxItems: 127,
				items: {
					type: 'object',
					properties: {
						type: {
							type: 'string',
							enum: [ 'addon', 'membership' ]
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
					additionalProperties: false
				}
			},
			codeholderData: {
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
								pattern: '^[^\\n]{2,15}$',
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
			}
		},
		minProperties: 1,
		additionalProperties: false
	},
	requirePerms: 'registration.entries.update'
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Make sure the registration entry exists
		const registrationEntry = await AKSO.db('registration_entries')
			.where('id', req.params.registrationEntryId)
			.first('status');
		if (!registrationEntry) {
			return res.sendStatus(404);
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
		// This should be moved to some lib eventually

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
				// TODO: Ensure the codeholder is visible given the user's member restrictions
				const codeholderExists = await AKSO.db('view_codeholders')
					.where({
						enabled: true,
						id: req.body.codeholderData,
						codeholderType: 'human'
					})
					.first(1);
				if (!codeholderExists) {
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
			// Validate offers
			const addonIds = [];
			const membershipIds = [];
			for (const offer of req.body.offers) {
				if (offer.type === 'addon') {
					addonIds.push(offer.id);
				} else if (offer.type === 'membership') {
					membershipIds.push(offer.id);
				}
			}

			// Make sure all addons exist
			const addonsExisting = await AKSO.db('pay_addons')
				.select('id')
				.whereIn('id', addonIds)
				.where('paymentOrgId', registrationOptions.paymentOrgId)
				.pluck('id');
			for (const id of addonIds) {
				if (addonsExisting.includes(id)) { continue; }
				return res.type('text/plain').status(400)
					.send(`Unknown addon ${id}`);
			}

			// Make sure all membership categories exist
			const membershipsExisting = await AKSO.db('membershipCategories')
				.select('id')
				.whereIn('id', membershipIds)
				.pluck('id');
			for (const id of membershipIds) {
				if (membershipsExisting.includes(id)) { continue; }
				return res.type('text/plain').status(400)
					.send(`Unknown membership category ${id}`);
			}
		}

		const trx = await createTransaction();

		const data = {
			year: req.body.year,
			fishyIsOkay: req.body.fishyIsOkay,
			internalNotes: req.body.internalNotes,
			currency: req.body.currency
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
						paymentAddonId: offer.type === 'addon' ? offer.id : undefined,
						membershipCategoryId: offer.type === 'membership' ? offer.id : undefined
					};
				}));
		}

		await trx.commit();

		res.sendStatus(204);
	}
};
