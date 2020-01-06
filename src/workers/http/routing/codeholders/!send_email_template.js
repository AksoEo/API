import * as AddressFormat from '@cpsdqs/google-i18n-address';

import QueryUtil from 'akso/lib/query-util';
import { sendRawMail } from 'akso/mail';
import { formatCodeholderName } from 'akso/workers/http/lib/codeholder-util';
import CodeholderResource from 'akso/lib/resources/codeholder-resource';
import { renderTemplate as renderEmailTemplate } from 'akso/lib/email-template-util';

import { schema as parSchema, memberFilter } from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: {
			type: 'object',
			properties: {
				emailTemplateId: {
					type: 'integer',
					format: 'uint32'
				},
				deleteTemplateOnComplete: {
					type: 'boolean',
					default: false
				}
			},
			required: [ 'emailTemplateId' ],
			additionalProperties: false
		},
		requirePerms: [
			'codeholders.read',
			'codeholders.send_email'
		]
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		if ('limit' in req.query) {
			return res.status(400).type('text/plain').send('?limit is not allowed');
		}
		if ('offset' in req.query) {
			return res.status(400).type('text/plain').send('?offset is not allowed');
		}
		if ('fields' in req.query) {
			return res.status(400).type('text/plain').send('?fields is not allowed');
		}

		// Make sure the user has the necessary perms
		const templateData = await AKSO.db('email_templates')
			.where({
				id: req.body.emailTemplateId,
				intent: 'codeholder'
			})
			.first('*');
		if (!templateData) { return res.sendStatus(404); }
		if (!req.hasPermission('email_templates.read.' + templateData.org)) { return res.sendStatus(403); }

		if (req.body.deleteTemplateOnComplete &&!req.hasPermission('email_templates.delete.' + templateData.org)) {
			return res.sendStatus(403);
		}

		let fieldWhitelist = null;
		if (req.memberFields) { fieldWhitelist = Object.keys(req.memberFields); }

		const baseQuery = AKSO.db('view_codeholders')
			.whereNotNull('email')
			.where('isDead', false)
			.orderBy('id', 'asc');
		memberFilter(schema, baseQuery, req);

		// Make sure the memberFilter passes before selecting
		const memberFilterQuery = baseQuery.clone();
		QueryUtil.simpleCollection(req, schema, memberFilterQuery, fieldWhitelist);
		memberFilterQuery.toSQL();

		// Respond so the client isn't left hanging
		res.sendStatus(202);

		const countryNames = [];
		(await AKSO.db('countries')
			.select('code', 'name_eo')
		).forEach(x => {
			countryNames[x.code] = x.name_eo;
		});

		// Then make the real request
		const customReq = { query: {}, ...req };
		customReq.query.fields = [
			'id',
			'firstName',
			'firstNameLegal',
			'lastName',
			'lastNameLegal',
			'fullName',
			'honorific',
			'oldCode',
			'newCode',
			'codeholderType',
			'hasPassword',

			'address.country',
			'address.countryArea',
			'address.city',
			'address.cityArea',
			'address.streetAddress',
			'address.postalCode',
			'address.sortingCode',

			'addressLatin.country',
			'addressLatin.countryArea',
			'addressLatin.city',
			'addressLatin.cityArea',
			'addressLatin.streetAddress',
			'addressLatin.postalCode',
			'addressLatin.sortingCode',

			'feeCountry',
			'email',
			'birthdate',
			'cellphone',
			'officePhone',
			'landlinePhone',
			'age',
			'agePrimo'
		];
		QueryUtil.simpleCollection(customReq, schema, baseQuery, fieldWhitelist);
		baseQuery.limit(100);
		
		let codeholders;
		let copyQuery = baseQuery.clone();
		do {
			codeholders = await copyQuery;
			if (!codeholders.length) { break; }
			const lastCodeholder = codeholders[codeholders.length - 1];
			copyQuery = baseQuery.clone()
				.where('id', '>', lastCodeholder.id);

			const sendPromises = [];
			for (const codeholderObj of codeholders) {
				const codeholder = new CodeholderResource(codeholderObj, customReq, schema).toJSON();

				const addressObj = {
					countryCode: 	codeholder.address.country,
					countryArea: 	codeholder.address.countryArea,
					city: 			codeholder.address.city,
					cityArea: 		codeholder.address.cityArea,
					streetAddress: 	codeholder.address.streetAddress,
					postalCode: 	codeholder.address.postalCode,
					sortingCode: 	codeholder.address.sortingCode,
					name: ''
				};
				const address = await AddressFormat.formatAddress(
					addressObj,
					false,
					'eo',
					countryNames[addressObj.countryCode]
				);

				const emailView = {
					'codeholder.id': codeholder.id,
					'codeholder.name': formatCodeholderName(codeholder),
					'codeholder.oldCode': codeholder.oldCode,
					'codeholder.newCode': codeholder.newCode,
					'codeholder.codeholderType': codeholder.codeholderType,
					'codeholder.hasPassword': codeholder.hasPassword,
					'codeholder.addressFormatted': address,
					'codeholder.addressLatin.country': codeholder.addressLatin.country,
					'codeholder.addressLatin.countryArea': codeholder.addressLatin.countryArea,
					'codeholder.addressLatin.city': codeholder.addressLatin.city,
					'codeholder.addressLatin.cityArea': codeholder.addressLatin.cityArea,
					'codeholder.addressLatin.streetAddress': codeholder.addressLatin.streetAddress,
					'codeholder.addressLatin.postalCode': codeholder.addressLatin.postalCode,
					'codeholder.addressLatin.sortingCode': codeholder.addressLatin.sortingCode,
					'codeholder.feeCountry': codeholder.feeCountry,
					'codeholder.email': codeholder.email,
					'codeholder.birthdate': codeholder.birthdate || null,
					'codeholder.cellphone': codeholder.cellphone || null,
					'codeholder.officePhone': codeholder.officePhone,
					'codeholder.landlinePhone': codeholder.landlinePhone || null,
					'codeholder.age': codeholder.age || null,
					'codeholder.agePrimo': codeholder.agePrimo || null
				};

				sendPromises.push(new Promise((resolve, reject) => {
					renderEmailTemplate(templateData, emailView)
						.then(renderedEmail => {
							const msg = {
								...renderedEmail,
								to: {
									name: emailView['codeholder.name'],
									email: codeholder.email
								},
								from: {
									name: templateData.fromName || '',
									email: templateData.from
								}
							};
							return sendRawMail(msg);
						})
						.then(resolve)
						.catch(reject);
				}));
			}
			await Promise.all(sendPromises);
		} while (codeholders.length);

		// Delete the template if necessary
		if (req.body.deleteTemplateOnComplete) {
			await AKSO.db('email_templates')
				.where('id', req.body.emailTemplateId)
				.delete();
		}
	}
};
