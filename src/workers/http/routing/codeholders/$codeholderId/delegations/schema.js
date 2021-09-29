import { promiseAllObject, arrToObjByKey } from 'akso/util';

export default {
	defaultFields: [ 'org' ],
	fields: {
		org: 'f',
		approvedBy: '',
		approvedTime: '',
		cities: '',
		countries: '',
		subjects: '',
		hosting: '',
		tos: ''
	},
	fieldAliases: {
		org: 'codeholders_delegations.org',
		cities: () => AKSO.db.raw('1'),
		countries: () => AKSO.db.raw('1'),
		subjects: () => AKSO.db.raw('1'),
		hosting: () => AKSO.db.raw('1'),
		tos: () => AKSO.db.raw('1')
	},
	alwaysSelect: [
		'codeholders_delegations.codeholderId',
		'org',
		'tos_docDataProtectionUEA',
		'tos_docDataProtectionUEA_time',
		'tos_docDelegatesUEA',
		'tos_docDelegatesUEA_time',
		'tos_docDelegatesDataProtectionUEA',
		'tos_docDelegatesDataProtectionUEA_time',
		'tos_paperAnnualBook',
		'tos_paperAnnualBook_time'
	],
	afterQuery: async function afterQuery (arr, done) {
		if (!arr.length) { return done(); }

		const org = arr[0].org;
		const codeholderIds = [ ...new Set(arr.map(x => x.codeholderId)) ];

		let data = await promiseAllObject({
			cities: AKSO.db('codeholders_delegations_cities')
				.select('codeholderId', 'city')
				.where('org', org)
				.whereIn('codeholderId', codeholderIds),
			countries: AKSO.db('codeholders_delegations_countries')
				.select('codeholderId', 'country', 'level')
				.where('org', org)
				.whereIn('codeholderId', codeholderIds),
			hosting: AKSO.db('codeholders_delegations_hosting')
				.select('codeholderId', 'maxDays', 'maxPersons', 'description', 'psProfileURL')
				.where('org', org)
				.whereIn('codeholderId', codeholderIds),
			subjects: AKSO.db('codeholders_delegations_subjects')
				.select('codeholderId', 'subjectId')
				.where('org', org)
				.whereIn('codeholderId', codeholderIds)
		});
		data = {
			cities: arrToObjByKey(data.cities, 'codeholderId', 'city'),
			countries: arrToObjByKey(data.countries, 'codeholderId'),
			hosting: arrToObjByKey(data.hosting, 'codeholderId'),
			subjects: arrToObjByKey(data.subjects, 'codeholderId', 'subjectId')
		};

		for (const row of arr) {
			row.cities = data.cities[row.codeholderId] || [];
			row.countries = data.countries[row.codeholderId] || [];
			row.hosting = data.hosting[row.codeholderId] ? data.hosting[row.codeholderId][0] : null;
			row.subjects = data.subjects[row.codeholderId] || [];
		}

		done();
	}
};
