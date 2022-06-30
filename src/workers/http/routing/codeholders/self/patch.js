import moment from 'moment-timezone';
import deepEqual from 'deep-equal';

import { insertAsReplace } from 'akso/util';

import { schema as parSchema, memberFieldsManual, memberFieldMatches, patchSchema, exclusiveFields, validatePatchFields, handleHistory } from '../schema';

const schema = {
	...parSchema,
	...{
		query: {
			type: 'object',
			properties: {
				modDesc: {
					type: 'string',
					minLength: 1,
					maxLength: 500
				}
			},
			additionalProperties: false
		},
		body: patchSchema
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Member fields
		let fields = Object.keys(req.body);
		if (!memberFieldsManual(fields, req, 'wa', req.ownMemberFields)) {
			return res.status(403).type('text/plain').send('Illegal codeholder fields used, check /perms');
		}

		// Obtain info on the codeholder
		const codeholderBefore = await AKSO.db('view_codeholders')
			.first('*')
			.where('id', req.user.user);

		// Ensure that no field belonging to a different codeholder type is used and perform additional field validation
		for (let field of fields) {
			if (exclusiveFields.all.includes(field) && !exclusiveFields[codeholderBefore.codeholderType].includes(field)) {
				return res.status(400).type('text/plain')
					.send(`The field ${field} cannot be used on codeholders of type ${codeholderBefore.codeholderType}`);
			}
		}

		const validationData = await validatePatchFields(req, codeholderBefore);
		fields = Object.keys(validationData.body);

		let oldAddress = null;

		const writeFields = memberFieldMatches(fields, req, 'w', req.ownMemberFields)
			.filter(field => codeholderBefore[field] !== validationData.body[field]);
		const askFields = fields
			.filter(field => !writeFields.includes(field))
			.filter(field => codeholderBefore[field] !== validationData.body[field]);
		
		// Update any fields for which we have a w permissions
		for (const field in validationData.updateData) {
			if (!writeFields.includes(field)) {
				delete validationData.updateData[field];
			}
		}
		if (!memberFieldsManual(['address'], req, 'w', req.ownMemberFields)) {
			validationData.addressUpdateData = null;
		}
		
		let oldDataFields = Object.keys(validationData.updateData);

		const trx = await req.createTransaction();
		const oldData = await trx('codeholders')
			.leftJoin('codeholders_human', 'codeholders.id', 'codeholders_human.codeholderId')
			.leftJoin('codeholders_org', 'codeholders.id', 'codeholders_org.codeholderId')
			.where('id', req.user.user)
			.first(oldDataFields);

		if (Object.keys(validationData.updateData).length) {
			await trx('codeholders')
				.leftJoin('codeholders_human', 'codeholders.id', 'codeholders_human.codeholderId')
				.leftJoin('codeholders_org', 'codeholders.id', 'codeholders_org.codeholderId')
				.where('id', req.user.user)
				.update(validationData.updateData);
		}

		if (validationData.addressUpdateData) {
			oldAddress = await trx('codeholders_address')
				.where('codeholderId', req.user.user)
				.first('*') || {};

			await insertAsReplace(trx('codeholders_address').insert(validationData.addressUpdateData), trx);
		}

		await handleHistory({
			req, cmtType: 'modDesc',
			oldData, oldAddress, validationData,
			codeholderId: req.user.user,
			fields: writeFields,
			db: trx
		});

		// Submit codeholder change requests
		const askData = {};
		for (const field of askFields) {
			askData[field] = validationData.body[field];
		}

		// Check if there's already a pending change request
		const existingChangeRequest = await trx('codeholders_changeRequests')
			.where({
				codeholderId: req.user.user,
				status: 'pending'
			})
			.first('id', 'data', 'codeholderDescription');

		if (existingChangeRequest) {
			let newCodeholderDescription = existingChangeRequest.codeholderDescription;
			if (req.query.modDesc) {
				if (newCodeholderDescription) {
					newCodeholderDescription = req.query.modDesc + '\n\nAŭtomate kunmetita kun antaŭa ŝanĝopeto:\n' + newCodeholderDescription;
				} else {
					newCodeholderDescription = req.query.modDesc;
				}
				newCodeholderDescription = newCodeholderDescription
					.substring(0, 500);
			}

			let changeData = {
				...existingChangeRequest.data,
				...askData
			};

			// Remove parts of changeData where a field in the original req.body (not validationData.body) matches the current value
			for (const [field, value] of Object.entries(req.body)) {
				const areEqual = deepEqual(value, validationData.codeholderBeforeRes.obj[field], { strict: true });
				if (!areEqual) { continue; }
				delete changeData[field];
			}

			if (Object.keys(changeData).length) {
				await trx('codeholders_changeRequests')
					.where('id', existingChangeRequest.id)
					.update({
						data: JSON.stringify(changeData),
						codeholderDescription: newCodeholderDescription
					});
			} else {
				await trx('codeholders_changeRequests')
					.where('id', existingChangeRequest.id)
					.update({
						status: 'canceled',
						codeholderDescription: newCodeholderDescription
					});
			}
		} else if (askFields.length) {
			await trx('codeholders_changeRequests')
				.insert({
					time: moment().unix(),
					codeholderId: req.user.user,
					codeholderDescription: req.query.modDesc,
					data: JSON.stringify(askData)
				});
		}

		await trx.commit();
		res.sendStatus(204);
	}
};
