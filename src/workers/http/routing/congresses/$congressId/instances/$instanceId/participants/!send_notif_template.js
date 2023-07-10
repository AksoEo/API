import { escapeId } from 'mysql2';

import QueryUtil from 'akso/lib/query-util';
import { renderTemplate } from 'akso/lib/notif-template-util';
import { sendRawMail } from 'akso/mail';
import { validateDataEntry } from 'akso/workers/http/lib/form-util';

import CongressParticipantResource from 'akso/lib/resources/congress-participant-resource';
import { schema as parSchema, getFormMetaData, afterQuery } from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: {
			type: 'object',
			properties: {
				notifTemplateId: {
					type: 'integer',
					format: 'uint32'
				},
				deleteTemplateOnComplete: {
					type: 'boolean',
					default: false
				}
			},
			required: [ 'notifTemplateId' ],
			additionalProperties: false,
		},
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

		// Make sure the user has the necessary congress perms
		const congressData = await AKSO.db('congresses')
			.innerJoin('congresses_instances', 'congressId', 'congresses.id')
			.where({
				congressId: req.params.congressId,
				'congresses_instances.id': req.params.instanceId
			})
			.first('org', 'dateFrom');
		if (!congressData) { return res.sendStatus(404); }
		if (!req.hasPermission('congress_instances.participants.read.' + congressData.org)) { return res.sendStatus(403); }

		// Make sure the user has the necessary notif template perms
		const templateData = await AKSO.db('notif_templates')
			.where({
				id: req.body.notifTemplateId,
				intent: 'congress',
			})
			.first('*');
		if (!templateData) { return res.sendStatus(404); }
		if (!req.hasPermission('notif_templates.read.' + templateData.org)) { return res.sendStatus(403); }

		if (req.body.deleteTemplateOnComplete &&!req.hasPermission('notif_templates.delete.' + templateOrgData.org)) {
			return res.sendStatus(403);
		}

		const formMetaData = await getFormMetaData(req.params.instanceId);

		// Make sure the filter is valid before sending
		QueryUtil.simpleCollection(req, parSchema, formMetaData.query);
		formMetaData.query.toSQL();

		// Respond so the client isn't left hanging
		res.sendStatus(202);

		const defaultCustomFormVars = await AKSO.db('congresses_instances_registrationForm_customFormVars')
			.select('name', 'default')
			.where('congressInstanceId', req.params.instanceId);

		// Set up the query
		formMetaData.query
			.select([
				'price', 'sequenceId', 'createdTime', 'd.dataId', 'amountPaid',
				...Object.entries(formMetaData.schema.fieldAliases)
					.filter(([key]) => key.startsWith('data.'))
					.map(([key, aliasFn]) => {
						return AKSO.db.raw(`(${aliasFn()}) AS ${escapeId(key, true)}`);
					})
			]);

		const recipientsStream = formMetaData.query.stream();
		const donePromise = new Promise((resolve, reject) => {
			recipientsStream.on('end', () => resolve());
			recipientsStream.on('error', e => reject);
		});

		const sendPromises = [];
		for await (const rawParticipant of recipientsStream) {
			const participant = new CongressParticipantResource(
				rawParticipant,
				{
					query: {
						fields: [ 'price', 'sequenceId', 'createdTime', 'dataId', 'amountPaid' ],
					},
				},
				null,
				formMetaData.formFieldsObj,
			).obj;

			let dataKeys = [];
			let dataMeta = [];
			let dataVals = [];
			for (const formField of formMetaData.formData.form) {
				if (!formField.el === 'input') { continue; }
				dataKeys.push(formField.name);
				dataMeta.push([ formField.type, formField.label, formField.variant ?? formField.currency ?? formField.tz ?? null ]);
				dataVals.push(participant.data[formField.name]);
			}

			const intentData = {
				'registrationEntry.price': participant.price,
				'registrationEntry.amountPaid': participant.amountPaid,
				'registrationEntry.currency': formMetaData.formData.price_currency,
				'registrationEntry.sequenceId': participant.sequenceId,
				'registrationEntry.createdTime': participant.createdTime,
				'registrationEntry.canEdit': formMetaData.formData.editable,
				'registrationEntry.dataId': participant.dataId.toString('hex'),
				'registrationEntry.dataKeys': dataKeys,
				'registrationEntry.dataMeta': dataMeta,
				'registrationEntry.dataVals': dataVals,
			};

			const addFormValues = {
				'@created_time': participant.createdTime,
				'@edited_time': participant.editedTime,
				'@is_member': participant.codeholderId ?
					await isActiveMember(participant.codeholderId, congressData.dateFrom) : false,
			};

			// Add default custom form vars
			for (const defaultCustomFormVar of defaultCustomFormVars) {
				addFormValues[defaultCustomFormVar.name.substring(1)] = defaultCustomFormVar.default;
			}

			// Add custom form var overrides
			const customFormVars = await AKSO.db('congresses_instances_participants_customFormVars')
				.select('name', 'value')
				.where('dataId', participant.dataId);
			for (const customFormVar of customFormVars) {
				addFormValues[customFormVar.name.substring(1)] = customFormVar.value;
			}

			const validatedDataEntry = await validateDataEntry({
				formData: formMetaData.formData,
				data: participant.data,
				allowInvalidData: true,
				addFormValues,
			});

			const participantEmail = validatedDataEntry.evaluate(formMetaData.formData.identifierEmail);
			if (typeof participantEmail !== 'string') { continue; }

			sendPromises.push(
				renderTemplate(templateData, intentData).then(renderedTemplate => {
					return sendRawMail({
						...renderedTemplate,
						to: {
							name: validatedDataEntry.evaluate(formMetaData.formData.identifierName),
							email: participantEmail,
						},
						from: {
							name: templateData.fromName ?? '',
							email: templateData.from,
						},
					});
				})
			);
		}

		await donePromise;
		await Promise.all(sendPromises);

		// Delete the template if necessary
		if (req.body.deleteTemplateOnComplete) {
			await AKSO.db('notif_templates')
				.where('id', req.body.notifTemplateId)
				.delete();
		}
	}
};
