class Enum {
	static get all () { return this._props; }
	static get allLower () { return this.all.map(p => p.toLowerCase()); }
	static indexOf (prop) { return this.all.indexOf(prop.toUpperCase()); }
	static has (prop) { return this.indexOf(prop) > -1; }
	static setProps (...props) { this._props = props.map(p => p.toUpperCase()); }
	static normalize (prop) { return prop.toUpperCase(); }

	static get (prop) {
		if (typeof prop === 'number') {
			return this.all[prop];
		} else {
			const index = this.indexOf(prop);
			if (index === -1) { return undefined; }
			return index;
		}
	}
}

export default Enum;
