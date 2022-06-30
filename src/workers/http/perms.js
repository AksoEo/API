import moment from 'moment-timezone';

export default async function init (req, res, next) { // eslint-disable-line no-unused-vars
	// Set default hard-coded business logic
	req.memberFields = { id: 'r' };
	req.memberFilter = {};
	req.permissions = [
		'membership_categories.read',
		'congresses.read.*'
	];

	req.ownMemberFields = {
		id: 'r',
		oldCode: 'r',
		newCode: 'r',
		codeholderType: 'r',
		creationTime: 'r',
		password: 'w',
		address: 'rw',
		addressPublicity: 'rw',
		addressInvalid: 'ra',
		feeCountry: 'ra',
		addressLatin: 'r',
		email: 'rw',
		emailPublicity: 'rw',
		officePhone: 'rw',
		officePhoneFormatted: 'r',
		officePhonePublicity: 'rw',
		profilePicture: 'rw',
		profilePictureHash: 'r',
		profilePicturePublicity: 'rw',
		logins: 'r',
		membership: 'r',
		searchName: 'r',
		website: 'rw',
		biography: 'rw',
		publicCountry: 'rw',
		publicEmail: 'rw',

		// Humans
		firstName: 'rw',
		firstNameLegal: 'rw',
		lastName: 'rw',
		lastNameLegal: 'rw',
		lastNamePublicity: 'rw',
		honorific: 'rw',
		birthdate: 'ra',
		age: 'r',
		agePrimo: 'r',
		profession: 'rw',
		landlinePhone: 'rw',
		landlinePhoneFormatted: 'r',
		landlinePhonePublicity: 'rw',
		cellphone: 'rw',
		cellphoneFormatted: 'r',
		cellphonePublicity: 'rw',

		// Orgs
		fullName: 'rw',
		fullNameLocal: 'rw',
		careOf: 'rw',
		nameAbbrev: 'rw'
	};

	// Grant contextual perms
	if (req.user && req.user.isUser()) {
		// Grant limited codeholders access if the user is a country delegate
		const countryDelegations = await AKSO.db('codeholders_delegations')
			.innerJoin('codeholders_delegations_countries', {
				'codeholders_delegations_countries.codeholderId': 'codeholders_delegations.codeholderId',
				'codeholders_delegations_countries.org': 'codeholders_delegations.org'
			})
			.select('country', 'level', 'codeholders_delegations.org')
			.where('codeholders_delegations.codeholderId', req.user.user);
		
		if (countryDelegations.length) {
			const delegations = {};
			for (const delegation of countryDelegations) {
				if (!(delegation.org in delegations)) {
					delegations[delegation.org] = {
						org: delegation.org,
						countriesMain: [],
						countriesVice: []
					};
				}

				if (delegation.level === 0) {
					delegations[delegation.org].countriesMain.push(delegation.country);
				} else {
					delegations[delegation.org].countriesVice.push(delegation.country);
				}
			}

			let delegationsFilter = Object.entries(delegations).map(([org, obj]) => {
				let filter = {
					org,
					$or: []
				};
				if (obj.countriesMain.length) {
					filter.$or.push({
						cityCountries: { $hasAny: obj.countriesMain }
					}, {
						$countries: {
							country: { $in: obj.countriesMain }
						}
					});
				}
				if (obj.countriesVice.length) {
					filter.$or.push({
						cityCountries: { $hasAny: obj.countriesVice },
						$not: {
							$countries: {
								country: { $in: obj.countriesVice }
							}
						}
					});
				}
				if (filter.$or.length === 1) {
					filter = {
						...filter,
						...filter.$or[0]
					};
					delete filter.$or;
				}

				return filter;
			});
			if (delegationsFilter.length > 1) {
				delegationsFilter = { $or: delegationsFilter };
			} else {
				delegationsFilter = delegationsFilter[0];
			}

			let delegationApplicationsFilter = Object.entries(delegations).map(([org, obj]) => {
				let filter = {
					org,
					cityCountries: {
						$hasAny: obj.countriesMain.concat(obj.countriesVice)
					},
					$or: [
						{ status: 'pending' },
						{
							statusTime: {
								// Only access for one week after last update
								$gte: moment().unix() - 604800
							}
						}
					]
				};

				return filter;
			});
			if (delegationApplicationsFilter.length > 1) {
				delegationApplicationsFilter = { $or: delegationApplicationsFilter };
			} else {
				delegationApplicationsFilter = delegationApplicationsFilter[0];
			}

			req.memberFilter = {
				$or: [
					{
						$delegations: delegationsFilter
					}, {
						$delegationApplications: delegationApplicationsFilter
					}
				]
			};

			for (const [org, obj] of Object.entries(delegations)) {
				req.permissions.push(...[
					'admin',
					'codeholders.read',
					'geodb.read',

					'codeholders.delegations.read.' + org,
					'codeholders.delegations.update.' + org,
					'codeholders.delegations.delete.' + org,

					'delegations.applications.read.' + org,
					'delegations.applications.update.' + org,

					'delegations.subjects.create.' + org,
					'delegations.subjects.read.' + org,
					'delegations.subjects.update.' + org,
					'delegations.subjects.delete.' + org,
				]);

				// Only main country delegates may modify country delegates
				for (const country of obj.countriesMain) {
					req.permissions.push(`codeholders.delegations.update_country_delegates.${org}.${country}`);
				}
			}

			req.memberFields = {
				...req.memberFields,
				newCode: 'r',
				codeholderType: 'r',
				'address.country': 'r',
				email: 'r',
				profilePicture: 'r',
				membership: 'r',
				biography: 'r',
				website: 'r',
				firstName: 'r',
				lastName: 'r',
				firstNameLegal: 'r',
				lastNameLegal: 'r',
				honorific: 'r',
				birthdate: 'r',
				age: 'r',
				agePrimo: 'r',
				profession: 'r',
				fullName: 'r',
				fullNameLocal: 'r',
				nameAbbrev: 'r',
			};
		}
	}

	// Concat permissions for all authenticated users
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
				if (path[bit] === true) { path[bit] = {}; }
				path = path[bit];
			}
		}
	}

	// Functions
	req.hasPermission = function hasPermission (perm) {
		let path = req.permsTree;
		const bits = perm.split('.');
		for (const bit of bits) {
			if (path === true) { return false; }
			if ('*' in path) { return true; }
			if (!(bit in path)) { return false; }
			path = path[bit];
		}
		return true;
	};

	// Merge member restrictions for all authenticated users
	if (req.user) {
		if (clientPerms.memberFields === null) {
			req.memberFields = null;
		} else {
			for (const [field, flags] of Object.entries(clientPerms.memberFields)) {
				if (!(field in req.memberFields)) {
					req.memberFields[field] = flags;
				} else {
					for (const flag of flags) {
						if (req.memberFields[field].includes(flag)) {
							continue;
						}
						req.memberFields[field] += flag;
					}
				}
			}
		}
		
		if (Object.keys(clientPerms.memberFilter).length) {
			if (!Object.keys(req.memberFilter).length) {
				req.memberFilter = clientPerms.memberFilter;
			} else if (req.memberFilter.$and) {
				let clientPermsAnd = [clientPerms.memberFilter];
				if (clientPerms.memberFields[0].$and) {
					clientPermsAnd = clientPerms.memberFields[0].$and;
				}
				req.memberFilter.$and.push(...clientPermsAnd);
			} else {
				req.memberFilter = {
					$and: [
						clientPerms.memberFilter,
						req.memberFilter
					]
				};
			}
		}
	}

	next();
}
