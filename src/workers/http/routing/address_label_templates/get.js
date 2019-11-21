import QueryUtil from 'akso/lib/query-util';
import AddressLabelTemplateResource from 'akso/lib/resources/address-label-template-resource';

import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: 'address_label_templates.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('addressLabelTemplates');
		await QueryUtil.handleCollection({ req, res, schema, query, Res: AddressLabelTemplateResource });
	}
};
