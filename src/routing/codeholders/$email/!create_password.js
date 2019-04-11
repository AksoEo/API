import moment from 'moment';
import crypto from 'pn/crypto';

import AKSOOrganization from '../../../lib/enums/akso-organization';
import * as AKSOMail from '../../../mail';

export default {
	schema: {
		query: null,
		body: {
			properties: {
				org: {
					type: 'string',
					enum: AKSOOrganization.allLower
				}
			},
			additionalProperties: false,
			required: [ 'org' ]
		}
	},

	run: async function run (req, res) {
		if (req.body.org !== 'akso') {
			return res.sendStatus(500); // todo
		}

		// Reply, then deal with it to prevent timing attacks
		res.sendStatus(202);

		// Try to find the codeholder
		const codeholder = await AKSO.db('codeholders')
			.where({
				email: req.params.email,
				password: null,
				enabled: true,
				isDead: false
			})
			.where(function () {
				this
					.where('createPasswordTime', '<', moment().unix() - AKSO.CREATE_PASSWORD_FREQ)
					.orWhere('createPasswordTime', null);
			})
			.first('id');

		if (!codeholder) { return; }

		// Update createPasswordTime and createPasswordKey
		const createPasswordKey = await crypto.randomBytes(16);

		await AKSO.db('codeholders')
			.where('id', codeholder.id)
			.update({
				createPasswordTime: moment().unix(),
				createPasswordKey: createPasswordKey
			});

		// Send the email
		await AKSOMail.renderSendEmail({
			org: req.body.org,
			tmpl: 'create-password',
			to: codeholder.id,
			view: {
				email: encodeURIComponent(req.params.email),
				key: createPasswordKey.toString('hex')
			}
		});
	}
};
