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

	let ageBuckets = '';
	for (let i = -5; i <= 115; i += 10) {
		const age = Math.max(i, 0);
		ageBuckets += `COUNT(CASE WHEN agePrimo >= ${age} AND agePrimo < ${i + 10} THEN 1 END) AS countAgePrimo_${age},\n`;
	}
	ageBuckets += 'COUNT(CASE WHEN agePrimo >= 125 THEN 1 END) AS countAgePrimo_rest,';
	function formatAgeBuckets (row) {
		const ageBucketData = {
			rest: row.countAgePrimo_rest,
		};
		for (let i = -5; i <= 115; i += 10) {
			const age = Math.max(i, 0);
			ageBucketData[age] = row['countAgePrimo_' + age];
		}
		return ageBucketData;
	}

	const rawStatsMembership = await AKSO.db.raw(`
		SELECT
			feeCountry, categoryId,
		    COUNT(1) AS \`count\`,
		    COUNT(CASE WHEN agePrimo <= 35 THEN 1 END) AS \`countTEJO\`,
		    AVG(age) AS age_avg,
		    MIN(age) AS age_min,
		    MAX(age) AS age_max,
		    ${ageBuckets}
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
		    ${ageBuckets}
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
		    ${ageBuckets}
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
		    ${ageBuckets}
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
		if (!(row.feeCountry in statistics)) {
			statistics[row.feeCountry] = { membershipCategories: [], roles: [] };
		}
		statistics[row.feeCountry].membershipCategories.push({
			membershipCategoryId: row.categoryId,
			membershipCategory: membershipCategories[row.categoryId][0],
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
				counts: formatAgeBuckets(row),
			},
		});
	}
	for (const row of rawStatsRoles) {
		if (!(row.feeCountry in statistics)) {
			statistics[row.feeCountry] = { membershipCategories: [], roles: [] };
		}
		statistics[row.feeCountry].roles.push({
			roleId: row.roleId,
			role: roles[row.roleId][0],
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
				counts: formatAgeBuckets(row),
			},
		});
	}

	statistics.total = {
		membershipCategories: rawStatsMembershipTotal.map(row => {
			return {
				membershipCategoryId: row.categoryId,
				membershipCategory: membershipCategories[row.categoryId][0],
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
					counts: formatAgeBuckets(row),
				},
			};
		}),
		roles: rawStatsRolesTotal.map(row => {
			return {
				roleId: row.roleId,
				role: roles[row.roleId][0],
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
					counts: formatAgeBuckets(row),
				},
			};
		}),
	};

	await AKSO.db('statistics').insert({
		date: yesterday,
		data: statistics,
	});
}
saveStatistics.intervalMs = 30 * 60 * 1000; // 30 minutes