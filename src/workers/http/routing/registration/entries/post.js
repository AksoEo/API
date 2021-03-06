import path from 'path';
import crypto from 'pn/crypto';
import moment from 'moment-timezone';
import * as AddressFormat from '@cpsdqs/google-i18n-address';
import { base32 } from 'rfc4648';

import { createTransaction } from 'akso/util';
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
			offers: {
				type: 'array',
				minItems: 1,
				maxItems: 127,
				items: {
					type: 'object',
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
		required: [
			'year',
			'currency',
			'offers',
			'codeholderData'
		],
		additionalProperties: false
	},
	requirePerms: 'registration.entries.create'
};

export default {
	schema: schema,

	run: async function run (req, res) {
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

		// Validate offers
		const membershipIds = [];
		for (const offer of req.body.offers) {
			if (offer.type === 'membership') {
				membershipIds.push(offer.id);
			}
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

		const trx = await createTransaction();

		const registrationEntryId = await crypto.randomBytes(15);
		const data = {
			id: registrationEntryId,
			year: req.body.year,
			fishyIsOkay: req.body.fishyIsOkay,
			internalNotes: req.body.internalNotes,
			currency: req.body.currency,
			timeSubmitted: moment().unix()
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
					membershipCategoryId: offer.type === 'membership' ? offer.id : undefined
				};
			}));

		await trx.commit();

		const idEncoded = base32.stringify(registrationEntryId);

		res.set('Location', path.join(AKSO.conf.http.path, 'registration/entries', idEncoded));
		res.set('X-Identifier', idEncoded);
		res.sendStatus(201);
	}
};
