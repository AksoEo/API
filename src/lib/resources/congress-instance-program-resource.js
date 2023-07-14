import SimpleResource from './simple-resource';

/**
 * A resource representing a congress instance program
 */
class CongressInstanceProgramResource extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);
		const fields = [...(req.query.fields || schema.defaultFields)];

		this.removeUnnecessary(fields);
	}
}

export default CongressInstanceProgramResource;
