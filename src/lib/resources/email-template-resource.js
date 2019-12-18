import SimpleResource from './simple-resource';

/**
 * A resource representing an email template
 */
class EmailTemplateResource extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);
		const fields = [...(req.query.fields || schema.defaultFields)];

		if (obj.base === 'raw') {
			delete obj.modules;
		} else if (obj.base === 'inherit') {
			delete obj.html;
			delete obj.text;
		}

		this.removeUnnecessary(fields);
	}
}

export default EmailTemplateResource;
