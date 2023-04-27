import { arrToObjByKey } from 'akso/util';

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

	const offerGroups = arrToObjByKey(
		await AKSO.db('registration_options_offerGroups')
			.select('*')
			.whereIn('year', years),
		'year',
	);

	const offersRaw = await AKSO.db('registration_options_offerGroups_offers')
		.select('*')
		.whereIn('year', years);
	const offers = {};
	for (const offer of offersRaw) {
		const year = offer.year;
		delete offer.year;
		if (!(year in offers)) {
			offers[year] = {};
		}
		const yearOffers = offers[year];

		const offerGroupId = offer.offerGroupId;
		delete offer.offerGroupId;
		if (!(offerGroupId in yearOffers)) {
			yearOffers[offerGroupId] = [];
		}
		yearOffers[offerGroupId].push({
			offerId: offer.id,
			type: offer.type,
			id: offer.paymentAddonId ?? offer.membershipCategoryId ?? offer.magazineId,
			price: offer.price_script ? {
				script: offer.price_script,
				var: offer.price_var,
				description: offer.price_description
			} : undefined,
			paperVersion: offer.type === 'magazine' ? !!offer.paperVersion : undefined,
		});
	}
	for (const offerYear of Object.values(offers)) {
		for (const offerGroup of Object.values(offerYear)) {
			offerGroup.sort((a, b) => a.offerId - b.offerId);
			offerGroup.forEach(offer => { delete offer.offerId; });
		}
	}

	for (const row of arr) {
		row.offers = offerGroups[row.year]
			.sort((a, b) => a.id - b.id)
			.map(offerGroup => {
				const offerGroupId = offerGroup.id;
				delete offerGroup.id;
				delete offerGroup.year;
				offerGroup.offers = offers[row.year][offerGroupId];
				return offerGroup;
			});
	}

	done();
}
