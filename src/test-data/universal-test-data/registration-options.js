export async function createRegistrationOptions () {
	await AKSO.db('registration_options')
		.insert([
			{
				year: 2021,
				enabled: 1,
				paymentOrgId: 2,
				currency: 'EUR'	
			}
		]);

	await AKSO.db('registration_options_offerGroups')
		.insert([
			{
				year: 2021,
				id: 0,
				title: 'Membrokategorioj',
				description: 'Tie ĉi eblas elekti en kiu kategorio vi volas membri.'	
			},
			{
				year: 2021,
				id: 1,
				title: 'Donacoj',
				description: 'Se vi havas la necesajn resursojn por donaci al la celoj de UEA kaj TEJO, ni estus aparte dankemaj.'	
			}
		]);

	await AKSO.db('registration_options_offerGroups_offers')
		.insert([
			/*eslint-disable */
			{"year":"2021","offerGroupId":"0","id":"0","type":"membership","paymentAddonId":null,"membershipCategoryId":"3","price_script":"{\"price\": {\"t\": \"n\", \"v\": 4400}}","price_var":"price","price_description":null},
			{"year":"2021","offerGroupId":"0","id":"1","type":"membership","paymentAddonId":null,"membershipCategoryId":"6","price_script":"{\"price\": {\"t\": \"n\", \"v\": 7400}}","price_var":"price","price_description":null},
			{"year":"2021","offerGroupId":"0","id":"2","type":"membership","paymentAddonId":null,"membershipCategoryId":"4","price_script":"{\"price\": {\"t\": \"n\", \"v\": 132000}}","price_var":"price","price_description":null},
			{"year":"2021","offerGroupId":"1","id":"0","type":"addon","paymentAddonId":"1","membershipCategoryId":null,"price_script":null,"price_var":null,"price_description":null}
			/*eslint-enable */
		]);
}
