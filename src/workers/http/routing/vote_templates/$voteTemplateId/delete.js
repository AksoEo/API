import AKSOOrganization from 'akso/lib/enums/akso-organization';

export default {
	schema: {},

	run: async function run (req, res) {
		const orgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('votes.read.' + org));

		const deleted = await AKSO.db('votes_templates')
			.where('id', req.params.voteTemplateId)
			.whereIn('org', orgs)
			.delete();

		res.sendStatus(deleted ? 204 : 404);
	}
};
