import { default as merge } from 'deepmerge';

export default async function init (req, res, next) { // eslint-disable-line no-unused-vars
	// Set default hard-coded business logic
	req.memberFields = {};
	req.memberFilter = {};
	req.permissions = [];

	req.ownMemberFields = {
		id: 'r',
		oldCode: 'r',
		newCode: 'r',
		codeholderType: 'r',
		password: 'w',
		address: 'rw',
		feeCountry: 'ra',
		addressLatin: 'r',
		email: 'rw',
		officePhone: 'rw',
		officePhoneFormatted: 'r',

		// Humans
		firstName: 'rw',
		firstNameLegal: 'rw',
		lastName: 'rw',
		lastNameLegal: 'rw',
		honorific: 'rw',
		birthdate: 'ra',
		age: 'r',
		agePrimo: 'r',
		profession: 'rw',
		landlinePhone: 'rw',
		landlinePhoneFormatted: 'r',
		cellphone: 'rw',
		cellphoneFormatted: 'r',

		// Orgs
		fullName: 'rw',
		fullNameLocal: 'rw',
		careOf: 'rw',
		nameAbbrev: 'rw'
	};

	// Override permissions for all authenticated clients
	let clientPerms;
	if (req.user) {
		clientPerms = await req.user.getPerms();
		req.permissions = req.permissions.concat(clientPerms.perms);
	}

	// Create permissions tree
	req.permsTree = {};
	for (let perm of req.permissions) {
		let path = req.permsTree;
		const bits = perm.split('.');
		for (let i = 0; i < bits.length; i++) {
			const bit = bits[i];
			const isLast = i+1 === bits.length;

			if (isLast) {
				path[bit] = true;
			} else {
				if (!(bit in path)) { path[bit] = {}; }
				path = path[bit];
			}
		}
	}

	// Functions
	req.hasPermission = function hasPermission (perm) {
		let path = req.permsTree;
		const bits = perm.split('.');
		for (let bit of bits) {
			if ('*' in path) { return true; }
			if (!(bit in path)) { return false; }
			path = path[bit];
		}
		return true;
	};

	// Override member restrictions for all authenticated clients
	if (req.user) {
		if (clientPerms.memberFields === null) {
			req.memberFields = null;
		} else {
			req.memberFields = merge(
				req.memberFields,
				clientPerms.memberFields
			);
		}

		if (req.hasPermission('codeholders.others')) {
			req.memberFilter = {};
		}
		req.memberFilter = merge(
			req.memberFilter,
			clientPerms.memberFilter
		);
	}

	next();
}
