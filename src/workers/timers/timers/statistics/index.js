import moment from 'moment-timezone';

import MembershipCategoryResource from 'akso/lib/resources/membership-category-resource';
import CodeholderRoleResource from 'akso/lib/resources/codeholder-role-resource';
import { arrToObjByKey } from 'akso/util';

export async function saveStatistics () {
	// Check if statistics for the past day have been saved
	const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
	const haveStatistics = await AKSO.db('statistics')
		.first(1)
		.where('date', yesterday);
	if (haveStatistics) { return; }

	const rawStatsMembership = await AKSO.db.raw(`
		SELECT
			feeCountry, categoryId,
		    COUNT(1) AS \`count\`,
		    COUNT(CASE WHEN agePrimo <= 35 THEN 1 END) AS \`countTEJO\`,
		    AVG(age) AS age_avg,
		    MIN(age) AS age_min,
		    MAX(age) AS age_max,
		    AVG(agePrimo) AS agePrimo_avg,
		    MIN(agePrimo) AS agePrimo_min,
		    MAX(agePrimo) AS agePrimo_max
		FROM membershipCategories_codeholders
		INNER JOIN view_codeholders ON view_codeholders.id = membershipCategories_codeholders.codeholderId
		INNER JOIN membershipCategories ON membershipCategories.id = membershipCategories_codeholders.categoryId
		WHERE
			(membershipCategories_codeholders.year = YEAR(CURDATE()) OR (lifetime AND year <= YEAR(CURDATE())))
		GROUP BY feeCountry, categoryId
		ORDER BY feeCountry, categoryId
	`).then(res => res[0]);
	const rawStatsMembershipTotal = await AKSO.db.raw(`
		SELECT
			categoryId,
		    COUNT(1) AS \`count\`,
		    COUNT(CASE WHEN agePrimo <= 35 THEN 1 END) AS \`countTEJO\`,
		    AVG(age) AS age_avg,
		    MIN(age) AS age_min,
		    MAX(age) AS age_max,
		    AVG(agePrimo) AS agePrimo_avg,
		    MIN(agePrimo) AS agePrimo_min,
		    MAX(agePrimo) AS agePrimo_max
		FROM membershipCategories_codeholders
		INNER JOIN view_codeholders ON view_codeholders.id = membershipCategories_codeholders.codeholderId
		INNER JOIN membershipCategories ON membershipCategories.id = membershipCategories_codeholders.categoryId
		WHERE
			(membershipCategories_codeholders.year = YEAR(CURDATE()) OR (lifetime AND year <= YEAR(CURDATE())))
		GROUP BY categoryId
		ORDER BY categoryId
	`).then(res => res[0]);
	const uniqueMembershipCategoryIds = [...new Set(rawStatsMembership.map(row => row.categoryId))];
	const membershipCategories = uniqueMembershipCategoryIds.length ? await AKSO.db('membershipCategories')
		.select('id', 'nameAbbrev', 'name', 'description', 'givesMembership', 'lifetime', 'availableFrom', 'availableTo')
		.whereIn('id', uniqueMembershipCategoryIds)
		.then(arr => arr.map(row => (new MembershipCategoryResource(row)).obj))
		.then(arr => arrToObjByKey(arr, 'id')) : {};

	const rawStatsRoles = await AKSO.db.raw(`
		SELECT
			feeCountry, roleId,
		    COUNT(1) AS \`count\`,
		    COUNT(CASE WHEN agePrimo <= 35 THEN 1 END) AS \`countTEJO\`,
		    AVG(age) AS age_avg,
		    MIN(age) AS age_min,
		    MAX(age) AS age_max,
		    AVG(agePrimo) AS agePrimo_avg,
		    MIN(agePrimo) AS agePrimo_min,
		    MAX(agePrimo) AS agePrimo_max
		FROM codeholderRoles_codeholders
		INNER JOIN view_codeholders ON view_codeholders.id = codeholderRoles_codeholders.codeholderId
		GROUP BY feeCountry, roleId
		ORDER BY feeCountry, roleId
	`).then(res => res[0]);
	const rawStatsRolesTotal = await AKSO.db.raw(`
		SELECT
			roleId,
		    COUNT(1) AS \`count\`,
		    COUNT(CASE WHEN agePrimo <= 35 THEN 1 END) AS \`countTEJO\`,
		    AVG(age) AS age_avg,
		    MIN(age) AS age_min,
		    MAX(age) AS age_max,
		    AVG(agePrimo) AS agePrimo_avg,
		    MIN(agePrimo) AS agePrimo_min,
		    MAX(agePrimo) AS agePrimo_max
		FROM codeholderRoles_codeholders
		INNER JOIN view_codeholders ON view_codeholders.id = codeholderRoles_codeholders.codeholderId
		GROUP BY roleId
		ORDER BY roleId
	`).then(res => res[0]);
	const uniqueRoleIds = [...new Set(rawStatsRoles.map(row => row.roleId))];
	const roles = uniqueRoleIds.length ? await AKSO.db('codeholderRoles')
		.select('id', 'name', 'description', 'public')
		.whereIn('id', uniqueRoleIds)
		.then(arr => arr.map(row => (new CodeholderRoleResource(row)).obj))
		.then(arr => arrToObjByKey(arr, 'id')) : {};

	const statistics = {};

	for (const row of rawStatsMembership) {
		let country = row.feeCountry;
		if (country === null) { country = 'xn'; }
		if (!(country in statistics)) {
			statistics[country] = { membershipCategories: [], roles: [] };
		}
		statistics[country].membershipCategories.push({
			membershipCategoryId: row.categoryId,
			membershipCategory: membershipCategories[row.categoryId],
			count: row.count,
			countTEJO: row.countTEJO,
			age: {
				avg: parseFloat(row.age_avg),
				min: row.age_min,
				max: row.age_max,
			},
			agePrimo: {
				avg: parseFloat(row.agePrimo_avg),
				min: row.agePrimo_min,
				max: row.agePrimo_max,
			},
		});
	}
	for (const row of rawStatsRoles) {
		let country = row.feeCountry;
		if (country === null) { country = 'xn'; }
		if (!(country in statistics)) {
			statistics[country] = { membershipCategories: [], roles: [] };
		}
		statistics[country].roles.push({
			roleId: row.roleId,
			role: roles[row.roleId],
			count: row.count,
			countTEJO: row.countTEJO,
			age: {
				avg: parseFloat(row.age_avg),
				min: row.age_min,
				max: row.age_max,
			},
			agePrimo: {
				avg: parseFloat(row.agePrimo_avg),
				min: row.agePrimo_min,
				max: row.agePrimo_max,
			},
		});
	}

	statistics.xt = {
		membershipCategories: rawStatsMembershipTotal.map(row => {
			return {
				membershipCategoryId: row.categoryId,
				membershipCategory: membershipCategories[row.categoryId],
				count: row.count,
				countTEJO: row.countTEJO,
				age: {
					avg: parseFloat(row.age_avg),
					min: row.age_min,
					max: row.age_max,
				},
				agePrimo: {
					avg: parseFloat(row.agePrimo_avg),
					min: row.agePrimo_min,
					max: row.agePrimo_max,
				},
			};
		}),
		roles: rawStatsRolesTotal.map(row => {
			return {
				roleId: row.roleId,
				role: roles[row.roleId],
				count: row.count,
				countTEJO: row.countTEJO,
				age: {
					avg: parseFloat(row.age_avg),
					min: row.age_min,
					max: row.age_max,
				},
				agePrimo: {
					avg: parseFloat(row.agePrimo_avg),
					min: row.agePrimo_min,
					max: row.agePrimo_max,
				},
			};
		}),
	};

	await AKSO.db('statistics').insert(Object.entries(statistics).map(([countryCode, data]) => {
		return { date: yesterday, countryCode, data: JSON.stringify(data) };
	}));
}
saveStatistics.intervalMs = 30 * 60 * 1000; // 30 minutes