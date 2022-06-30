import { rollbackTransaction, insertAsReplace } from 'akso/util';
import { modQuerySchema } from 'akso/workers/http/lib/codeholder-util';

import { schema as parSchema, memberFilter, memberFieldsManual, patchSchema, exclusiveFields, validatePatchFields, handleHistory } from '../schema';

const schema = {
	...parSchema,
	...{
		query: modQuerySchema,
		body: patchSchema,
		requirePerms: 'codeholders.update'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Member fields
		const fields = Object.keys(req.body);
		if (!memberFieldsManual(fields, req, 'w')) {
			return res.status(403).type('text/plain').send('Illegal codeholder fields used, check /perms');
		}

		// Generate the member filter lookup before beginning the transaction to reduce latency
		const findCodeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first('*');
		memberFilter(schema, findCodeholderQuery, req);

		// Ensure that the codeholder exists, is visible through the member filter and is of the right type
		const codeholderBefore = await findCodeholderQuery;
		if (!codeholderBefore) { return res.sendStatus(404); }
		const codeholderType = codeholderBefore.codeholderType;

		// Ensure that no field belonging to a different codeholder type is used and perform additional field validation
		for (let field of fields) {
			if (exclusiveFields.all.includes(field) && !exclusiveFields[codeholderType].includes(field)) {
				return res.status(400).type('text/plain')
					.send(`The field ${field} cannot be used on codeholders of type ${codeholderType}`);
			}
		}

		const validationData = await validatePatchFields(req, codeholderBefore);

		let oldDataFields = Object.keys(validationData.updateData);
		let oldData = null;
		let oldAddress = null;

		const trx = await req.createTransaction();
		oldData = await trx('codeholders')
			.leftJoin('codeholders_human', 'codeholders.id', 'codeholders_human.codeholderId')
			.leftJoin('codeholders_org', 'codeholders.id', 'codeholders_org.codeholderId')
			.where('id', req.params.codeholderId)
			.first(oldDataFields);

		if (Object.keys(validationData.updateData).length) {
			await trx('codeholders')
				.leftJoin('codeholders_human', 'codeholders.id', 'codeholders_human.codeholderId')
				.leftJoin('codeholders_org', 'codeholders.id', 'codeholders_org.codeholderId')
				.where('id', req.params.codeholderId)
				.update(validationData.updateData);
		}

		if (validationData.addressUpdateData) {
			oldAddress = await trx('codeholders_address')
				.where('codeholderId', req.params.codeholderId)
				.first('*') || {};

			await insertAsReplace(trx('codeholders_address').insert(validationData.addressUpdateData), trx);
		}

		// Ensure we can still see the codeholder through the member filter
		const foundCodeholder = await findCodeholderQuery.transacting(trx);

		if (!foundCodeholder) {
			res.status(400).type('text/plain').send('Codeholder would violate member filter after update');
			await rollbackTransaction(trx);
			return;
		}

		await handleHistory({
			req, cmtType: 'modCmt',
			oldData, oldAddress, validationData,
			codeholderId: req.params.codeholderId,
			fields: Object.keys(validationData.body),
			db: trx
		});

		await trx.commit();
		res.sendStatus(204);
	}
};
