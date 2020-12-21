import { schema as parSchema } from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: 'registration.options.delete'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const deleted = await AKSO.db('registration_options')
			.where('year', req.params.year)
			.delete();

		res.sendStatus(deleted ? 204 : 404);
	}
};
