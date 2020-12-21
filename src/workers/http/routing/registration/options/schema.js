export const schema = {
	defaultFields: [ 'year' ],
	fields: {
		year: 'f',
		enabled: 'f',
		paymentOrgId: 'f',
		currency: 'f',
		offers: ''
	},
	fieldAliases: {
		offers: () => AKSO.db.raw('1')
	},
	alwaysSelect: [ 'year' ]
};

export async function afterQuery (arr, done) {
	if (!arr.length || !arr[0].offers) { return done(); }

	const years = arr.map(row => row.year);

	const offerGroups = await AKSO.db('registration_options_offerGroups')
		.select('year', 'id', 'title', 'description')
		.whereIn('year', years)
		.orderBy('year', 'id');

	const offers = await AKSO.db('registration_options_offerGroups_offers')
		.select('year', 'offerGroupId', 'type', 'paymentAddonId',
			'membershipCategoryId', 'price_script', 'price_var',
			'price_description')
		.whereIn('year', years)
		.orderBy('year', 'offerGroupId', 'id');

	let offerGroupIndex = 0;
	let offerGroupOffersIndex = 0;
	for (const row of arr) {
		for (let i = offerGroupIndex; i < offerGroups.length; i = ++offerGroupIndex) {
			const offerGroup = offerGroups[i];
			if (offerGroup.year !== row.year) { break; }
			if (typeof row.offers !== 'object') { row.offers = []; }

			const offerGroupOffers = [];
			for (let n = offerGroupOffersIndex; n < offers.length; n = ++offerGroupOffersIndex) {
				const offer = offers[n];
				if (offer.year !== row.year) { break; }
				if (offer.offerGroupId !== offerGroup.id) { break; }

				offerGroupOffers.push({
					type: offer.type,
					id: offer.paymentAddonId || offer.membershipCategoryId,
					price: offer.price_script ? {
						script: offer.price_script,
						var: offer.price_var,
						description: offer.price_description
					} : undefined
				});
			}

			row.offers.push({
				title: offerGroup.title,
				description: offerGroup.description,
				offers: offerGroupOffers
			});
		}
	}

	done();
}
