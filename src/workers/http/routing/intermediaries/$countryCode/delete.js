import { schema as parSchema } from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: ['intermediaries.delete', 'codeholders.read']
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const deleted = await AKSO.db('intermediaries')
			.where('countryCode', req.params.countryCode)
			.delete();
		res.sendStatus(deleted ? 204 : 404);
	}
};
