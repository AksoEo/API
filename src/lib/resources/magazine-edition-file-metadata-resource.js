import SimpleResource from './simple-resource';

/**
 * A resource representing magazine edition file metadata
 */
class MagazineEditionFileMetadataResource extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);

		const fields = req.query.fields || schema.defaultFields;
		this.removeUnnecessary(fields);
	}
}

export default MagazineEditionFileMetadataResource;
