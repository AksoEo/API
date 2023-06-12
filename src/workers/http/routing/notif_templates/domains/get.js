import AKSOOrganization from 'akso/lib/enums/akso-organization';

export default {
	schema: {},

	run: async function run (req, res) {
		const orgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('notif_templates.read.' + org));
		
		const filteredDomains = {};
		for (const [ orgUpper, orgDomains ] of Object.entries(AKSOOrganization.domains)) {
			const org = orgUpper.toLowerCase();
			if (!orgs.includes(org)) { continue; }
			filteredDomains[org] = orgDomains;
		}

		res.sendObj(filteredDomains);
	}
};
