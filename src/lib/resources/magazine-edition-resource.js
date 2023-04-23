import moment from 'moment-timezone';

import SimpleResource from './simple-resource';

/**
 * A resource representing a magazine edition
 */
class MagazineEditionResource extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);

		const fields = req.query.fields || schema.defaultFields;

		if ('date' in obj) { obj.date = moment(obj.date).format('Y-MM-DD'); }

		if ('files' in obj) {
			if (obj.files === null) { obj.files = []; }
			else { obj.files = obj.files.split(','); }
		}

		if (fields.includes('subscriberFiltersCompiled')) {
			if (obj.subscribers === null) {
				obj.subscriberFiltersCompiled = null;
			} else {
				const theYear = moment().year();

				obj.subscriberFiltersCompiled = {};
				for (const [key, val] of Object.entries(obj.subscribers)) {
					obj.subscriberFiltersCompiled[key] = val;
					if (typeof val !== 'object') { continue; }

					let includeLastYear = false;
					if (val.membersIncludeLastYear) {
						// If the duration has not yet been exceeded, modify the below schema
						const dur = moment.duration(val.membersIncludeLastYear);
						const prevYear = moment().subtract(dur).year();
						includeLastYear = prevYear < theYear;
					}

					let filterArr = [
						// Subscribers
						{
							$magazineSubscriptions: {
								magazineId: obj.magazineId,
								year: includeLastYear
									? { $in: [ theYear - 1, theYear ] }
									: theYear,
								paperVersion: key === 'paper' ? true : undefined,
							}
						}
					];

					if (val.members) { // true or object
						const memberFilter = {
							$membership: {
								givesMembership: val.membersFilterInner ? undefined : true,
								$or: [
									{
										year: includeLastYear
											? { $in: [ theYear - 1, theYear ] }
											: theYear
									},
									{
										lifetime: true,
										year: { $lte: theYear }
									}
								]
							}
						};
						if (val.membersFilterInner) {
							memberFilter.$membership = {
								$and: [
									memberFilter.$membership,
									val.membersFilterInner
								],
							};
						}

						if (typeof val.members === 'object') {
							filterArr.push({
								$and: [
									memberFilter,
									val.members
								]
							});
						} else {
							filterArr.push(memberFilter);
						}
					}

					if (val.filter) {
						filterArr.push(val.filter);
					}

					let filter;
					if (filterArr.length === 1) {
						filter = {
							isDead: false,
							...filterArr[0],
						};
					} else {
						filter = {
							isDead: false,
							$or: filterArr
						};
					}

					if (val.excludeFilter) {
						filter = {
							$and: [
								filter,
								{
									$not: val.excludeFilter,
								},
							],
						};
					}

					obj.subscriberFiltersCompiled[key] = filter;
				}
			}
		}

		this.removeUnnecessary(fields);
	}
}

export default MagazineEditionResource;
