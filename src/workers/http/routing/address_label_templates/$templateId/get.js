import QueryUtil from 'akso/lib/query-util';
import AddressLabelTemplateResource from 'akso/lib/resources/address-label-template-resource';

import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: 'address_label_templates.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('addressLabelTemplates')
			.where('id', req.params.templateId);
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new AddressLabelTemplateResource(row);
		res.sendObj(obj);
	}
};
