import moment from 'moment-timezone';

import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: null,
		body: {
			type: 'object',
			properties: {
				applicantNotes: {
					type: 'string',
					nullable: true,
					minLength: 1,
					maxLength: 2000
				},
				internalNotes: {
					type: 'string',
					nullable: true,
					minLength: 1,
					maxLength: 5000
				},
				status: {
					type: 'string',
					enum: [
						'pending',
						'approved',
						'denied'
					]
				}
			},
			additionalProperties: false,
			minProperties: 1
		},
		requirePerms: [ 'codeholders.read', 'delegations.applications.update.uea' ] // Currently only UEA
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Find the application if it exists and can be seen through the member filter
		const application = await AKSO.db('delegations_applications')
			.first('codeholderId')
			.whereExists(function () {
				this.from('view_codeholders')
					.select(1)
					.whereRaw('delegations_applications.codeholderId = view_codeholders.id');
				memberFilter(codeholderSchema, this, req);
			})
			.where('id', req.params.applicationId)
			.where('org', 'uea'); // Currently only uea
		if (!application) {
			return res.sendStatus(404);
		}

		const updateData = {...req.body};
		if ('status' in req.body) {
			updateData.statusTime = moment().unix();
			updateData.statusBy = req.user.modBy;
		}

		await AKSO.db('delegations_applications')
			.where('id', req.params.applicationId)
			.update(updateData);

		res.sendStatus(204);
	}
};
