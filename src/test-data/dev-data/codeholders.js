import moment from 'moment-timezone';

export async function createCodeholders () {
	const codeholders = [
		{
			base: {
				codeholderType: 'human',
				creationTime: moment().unix(),
				oldCode: 'test',
				newCode: 'teeest',
				password: '$2b$12$dEvwKG4oznSwcmu9kWzws.61JyzlLTrYkR9ojbeRlmweIgHI9lCBG',
				email: 'mia@tejo.org',
				feeCountry: 'us'
			},
			human: {
				firstNameLegal: 'Test',
				lastNameLegal: 'McTest',
				honorific: 'D-ro',
				birthdate: '1998-03-01'
			},
			address: {
				country: 'us',
				countryArea: 'NY',
				countryArea_latin: 'New York',
				city: 'BROOKLYN',
				city_latin: 'BROOKLYN',
				cityArea: '',
				cityArea_latin: '',
				streetAddress: '1 Union Street',
				streetAddress_latin: '1 Union Street',
				postalCode: '11231',
				postalCode_latin: '11231',
				sortingCode: '',
				sortingCode_latin: '',
				search: 'US Usono NY New York BROOKLYN 1 Union Street 11231'
			}
		},
		{
			base: {
				codeholderType: 'org',
				creationTime: moment().unix(),
				oldCode: 'tejo',
				newCode: 'xxtejo',
				password: '$2b$12$dEvwKG4oznSwcmu9kWzws.61JyzlLTrYkR9ojbeRlmweIgHI9lCBG',
				email: 'admin@akso.org',
				feeCountry: 'nl',
				officePhone: '+31104361044'
			},
			org: {
				fullName: 'Tutmonda Esperantista Junulara Organizo',
				fullNameLocal: 'Wereld Esperanto-Jongeren Organisatie',
				nameAbbrev: 'TEJO'
			},
			address: {
				country: 'nl',
				countryArea: '',
				countryArea_latin: '',
				city: 'ROTTERDAM',
				city_latin: 'ROTTERDAM',
				cityArea: '',
				cityArea_latin: '',
				streetAddress: 'Nieuwe Binnenweg 176',
				streetAddress_latin: 'Nieuwe Binnenweg 176',
				postalCode: '3015BJ',
				postalCode_latin: '3015BJ',
				sortingCode: '',
				sortingCode_latin: '',
				search: 'NL Nederlando ROTTERDAM Nieuwe Binnenweg 176 3015BJ'
			}
		},
		{
			base: {
				codeholderType: 'human',
				creationTime: moment().unix(),
				newCode: 'dooder',
				password: '$2b$12$lKXsKxh3E3Ze3/Hv9bTonOTB3azI9z40Ws.BoKM/xRpt67M5Yxvn.',
				email: 'cpsdqs@gmail.com'
			},
			human: {
				firstNameLegal: 'derpy',
				lastNameLegal: 'hooves'
			}
		}
	];

	for (const codeholder of codeholders) {
		const insertReturn = await AKSO.db('codeholders')
			.insert(codeholder.base);
		codeholder.id = insertReturn[0];
	}

	await AKSO.db('codeholders_human')
		.insert(
			codeholders
				.filter(x => x.base.codeholderType === 'human')
				.map(x => {
					return {
						codeholderId: x.id,
						...x.human
					};
				})
		);

	await AKSO.db('codeholders_org')
		.insert(
			codeholders
				.filter(x => x.base.codeholderType === 'org')
				.map(x => {
					return {
						codeholderId: x.id,
						...x.org
					};
				})
		);

	await AKSO.db('codeholders_address')
		.insert(
			codeholders
				.filter(x => x.address)
				.map(x => {
					return {
						codeholderId: x.id,
						...x.address
					};
				})
		);
}

export async function setUpCodeholderTotp () {
	await AKSO.db('codeholders_totp')
		.insert([
			{
				codeholderId: (await AKSO.db('codeholders').where('newCode', 'xxtejo').first('id')).id,
				secret: Buffer.from('FC60F88551162A663E1E323F87320979A8CCFA7FE24DD63F334CE28FE4E3DC34', 'hex'),
				iv: Buffer.from('b1e47d46289479b050be23f7a28f0479', 'hex')
			}
		]);
}
