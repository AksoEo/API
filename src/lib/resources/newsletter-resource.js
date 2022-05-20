import SimpleResource from './simple-resource';

/**
 * A resource representing a newsletter
 */
class NewsletterResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if ('public' in obj) {
			obj.public = !!obj.public;
		}
	}
}

export default NewsletterResource;
