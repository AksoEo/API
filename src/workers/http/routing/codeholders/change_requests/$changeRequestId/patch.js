import { createTransaction } from 'akso/util';
import AuthClient from 'akso/workers/http/lib/auth-client';

import { handleHistory } from 'akso/workers/http/routing/codeholders/schema';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				internalNotes: {
					type: 'string',
					nullable: true,
					minLength: 1,
					maxLength: 5000
				},
				status: {
					type: 'string',
					enum: [
						'approved',
						'denied',
						'canceled'
					]
				}
			},
			minProperties: 1,
			additionalProperties: false
		},
		requirePerms: 'codeholders.change_requests.update'
	},

	run: async function run (req, res) {
		const currentRequest = await AKSO.db('codeholders_changeRequests')
			.first('status', 'codeholderId', 'data')
			.where('id', req.params.changeRequestId);
		if (!currentRequest) { res.sendStatus(404); }

		if ('status' in req.body && currentRequest.status !== 'pending') {
			res.type('text/plain').status(400)
				.send('The status of this change request is not pending and the status may thus not be changed');
		}

		const trx = await createTransaction();

		await trx('codeholders_changeRequests')
			.where('id', req.params.changeRequestId)
			.update(req.body);

		if (req.body.status === 'approved') {
			// Fulfil the change request
			const oldData = await trx('codeholders')
				.leftJoin('codeholders_human', 'codeholders.id', 'codeholders_human.codeholderId')
				.leftJoin('codeholders_org', 'codeholders.id', 'codeholders_org.codeholderId')
				.where('id', currentRequest.codeholderId)
				.first(Object.keys(currentRequest.data));

			await trx('codeholders')
				.leftJoin('codeholders_human', 'codeholders.id', 'codeholders_human.codeholderId')
				.leftJoin('codeholders_org', 'codeholders.id', 'codeholders_org.codeholderId')
				.where('id', currentRequest.codeholderId)
				.update(currentRequest.data);

			const fakeReq = {
				user: new AuthClient(currentRequest.codeholderId)
			};

			await handleHistory({
				req: fakeReq, cmtType: 'modDescApproved',
				approverUser: req.user, oldData,
				codeholderId: currentRequest.codeholderId,
				fields: Object.keys(currentRequest.data),
				db: trx
			});
		}

		await trx.commit();

		res.sendStatus(204);
	}
};
