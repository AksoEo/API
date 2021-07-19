import moment from 'moment-timezone';

import { createTransaction, insertAsReplace } from 'akso/util';

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
		const fields = Object.keys(req.body);
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

		const validationData = await validatePatchFields(req, res, codeholderBefore);

		let oldAddress = null;

		const writeFields = memberFieldMatches(fields, req, 'w', req.ownMemberFields);
		const askFields = fields
			.filter(field => !writeFields.includes(field))
			.filter(field => codeholderBefore[field] !== req.body[field]);
		
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

		const trx = await createTransaction();
		// TODO: Why is this not using view_codeholders?
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
			fields: Object.keys(req.body),
			db: trx
		});

		// Submit codeholder change requests
		if (askFields.length) {
			const askData = {};
			for (const field of askFields) {
				askData[field] = req.body[field];
			}

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
