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
		externalLoc: 'f'
	},
	fieldAliases: {
		'rating.rating': 'rating',
		'rating.max': 'rating_max',
		'rating.type': 'rating_type'
	},
	alwaysSelect: [ 'type' ]
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
