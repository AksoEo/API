import AKSOOrganization from 'akso/lib/enums/akso-organization';

import { domains } from '../schema';

export default {
	schema: {},

	run: async function run (req, res) {
		const orgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('notif_templates.read.' + org));
		
		const filteredDomains = {};
		for (const [ org, orgDomains ] of Object.entries(domains)) {
			if (!orgs.includes(org)) { continue; }
			filteredDomains[org] = orgDomains;
		}

		res.sendObj(filteredDomains);
	}
};
