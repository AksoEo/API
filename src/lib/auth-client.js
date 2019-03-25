export default class AuthClient {
	constructor (user, app) {
		this.user = user;
		this.app = app;
	}

	isUser () {
		return !!this.user;
	}

	isApp () {
		return !!this.app;
	}
}
