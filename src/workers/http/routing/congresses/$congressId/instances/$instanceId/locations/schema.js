import moment from 'moment-timezone';

export const schema = {
	defaultFields: [ 'id' ],
	fields: {
		id: 'f',
		name: 'fs',
		type: 'f',
		description: 's',
		address: '',
		ll: '',
		'rating.rating': '',
		'rating.max': '',
		'rating.type': '',
		icon: '',
		externalLoc: 'f',
		openHours: ''
	},
	fieldAliases: {
		'rating.rating': 'rating',
		'rating.max': 'rating_max',
		'rating.type': 'rating_type',
		openHours: () => AKSO.db.raw('1')
	},
	alwaysSelect: [ 'id', 'type', 'rating.rating', 'rating.max', 'rating.type' ],
	customFilterLogicOps: {
		$open: ({ query, filter } = {}) => {
			if (filter !== null && typeof filter !== 'string') {
				const err = new Error('$open expects a string or null');
				err.statusCode = 400;
				throw err;
			}

			if (filter === null) {
				query.whereNotExists(function () {
					this.select(1)
						.from('congresses_instances_locations_openHours')
						.whereRaw('congressInstanceLocationId = id');
				});
			} else {
				const momentObj = moment(filter, 'YYYY-MM-DDTHH:mm:ss', true);
				if (!momentObj.isValid()) {
					const err = new Error('Invalid date-time string passed to $open');
					err.statusCode = 400;
					throw err;
				}

				const time = momentObj.format('HH:mm:00');
				query.whereExists(function () {
					this.select(1)
						.from('congresses_instances_locations_openHours')
						.whereRaw('congressInstanceLocationId = id')
						.where('date', momentObj.format('YYYY-MM-DD'))
						.where('openTime', '<=', time)
						.where('closeTime', '>', time);
				});
			}
		}
	}
};

export const icons = [
	'GENERIC', 'STAR', 'BUS', 'TRAIN', 'AIRPORT', 'TAXI', 'METRO', 'TRAM',
	'FERRY', 'BIKE_RENTAL', 'PARKING', 'GAS_STATION', 'ATM', 'HOSPITAL',
	'PHARMACY', 'PRINT_SHOP', 'MALL', 'LAUNDY_SERVICE', 'POST_OFFICE',
	'TOURIST_INFORMATION', 'POLICE', 'RESTAURANT', 'FAST_FOOD', 'CAFE', 'BAR',
	'GROCERY_STORE', 'CONVENIENCE_STORE', 'STORE', 'MUSEUM', 'MOVIE_THEATER',
	'THEATER', 'CULTURAL_CENTER', 'LIBRARY', 'POINT_OF_INTEREST', 'HOTEL',
	'HOSTEL'
];

export async function afterQuery (arr, done) {
	if (!arr.length || !arr[0].openHours) { return done(); }

	const openHoursArr = await AKSO.db('congresses_instances_locations_openHours')
		.select('*')
		.whereIn('congressInstanceLocationId', arr.map(row => row.id))
		.orderBy('date', 'openTime');

	const hoursObj = {};
	for (const hoursEntry of openHoursArr) {
		if (!(hoursEntry.congressInstanceLocationId in hoursObj)) {
			hoursObj[hoursEntry.congressInstanceLocationId] = {};
		}
		const hoursObjEntry = hoursObj[hoursEntry.congressInstanceLocationId];

		const date = moment(hoursEntry.date).format('YYYY-MM-DD');
		if (!(date in hoursObjEntry)) {
			hoursObjEntry[date] = [];
		}

		const openTime = hoursEntry.openTime.substring(0, 5);
		const closeTime = hoursEntry.closeTime.substring(0, 5);
		const interval = `${openTime}-${closeTime}`;
		hoursObjEntry[date].push(interval);
	}
	for (const row of arr) {
		row.openHours = hoursObj[row.id] || null;
	}

	done();
}

export function parseOpenHours(openHoursObj, congressDateFrom, congressDateTo) {
	let openHours = null;
	if (openHoursObj && Object.values(openHoursObj).length) {
		openHours = [];

		for (const [date, intervals] of Object.entries(openHoursObj)) {
			if (!Array.isArray(intervals)) {
				const err = new Error('openHours expects an object of key:hoursArr');
				err.statusCode = 400;
				throw err;
			}

			if (!intervals.length) {
				const err = new Error('Empty intervals array passed to openHours');
				err.statusCode = 400;
				throw err;
			}

			const dateParsed = moment(date, 'YYYY-MM-DD', true);
			if (!dateParsed.isValid()) {
				const err = new Error('Invalid openHours date ' + date);
				err.statusCode = 400;
				throw err;
			}
			if (dateParsed.isBefore(congressDateFrom) || dateParsed.isAfter(congressDateTo)) {
				const err = new Error('The openHours dates must be within the time of the congress instance');
				err.statusCode = 400;
				throw err;
			}

			for (const interval of intervals) {
				const intervalBits = interval.match(/^(\d\d:\d\d)-(\d\d:\d\d)$/);
				const timeFrom = moment(intervalBits[1], 'HH:mm', true);
				if (!timeFrom.isValid()) {
					const err = new Error('Invalid time ' + intervalBits[1]);
					err.statusCode = 400;
					throw err;
				}
				const timeTo = moment(intervalBits[2], 'HH:mm', true);
				if (!timeTo.isValid()) {
					const err = new Error('Invalid time ' + intervalBits[2]);
					err.statusCode = 400;
					throw err;
				}
				if (timeTo.isSameOrBefore(timeFrom)) {
					const err = new Error('openHours must not have a closing time before or equal to the opening time');
					err.statusCode = 400;
					throw err;
				}

				openHours.push({
					date: date,
					openTime: intervalBits[1] + ':00',
					closeTime: intervalBits[2] + ':00'
				});
			}
		}
	}

	return openHours;
}
