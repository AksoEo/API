export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		res.sendObj({
			permissions: req.permissions,
			memberFields: req.memberFields,
			memberFilter: req.memberFilter
		});
	}
};
