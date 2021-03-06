import moment from 'moment-timezone';

export async function createCodeholders () {
	const codeholders = [
		{
			base: {
				codeholderType: 'org',
				newCode: 'xxxuea',
				feeCountry: 'nl',
				officePhone: '+31104361044'
			},
			org: {
				fullName: 'Universala Esperanto-Asocio',
				nameAbbrev: 'UEA'
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
				newCode: 'xiapin',
				feeCountry: 'cn'
			},
			human: {
				firstNameLegal: 'Ping',
				lastNameLegal: 'Xia',
				honorific: 'Ge-ro'
			},
			address: {
				country: 'cn',
				countryArea: '云南省',
				countryArea_latin: 'Yunnan Sheng',
				city: '临沧市',
				city_latin: 'Lincang Shi',
				cityArea: '',
				cityArea_latin: '',
				streetAddress: '中关村东路1号',
				streetAddress_latin: '中关村东路1号',
				postalCode: '677400',
				postalCode_latin: '677400',
				sortingCode: '',
				sortingCode_latin: '',
				search: 'CN Ĉinio 云南省 Yunnan Sheng Lincang Shi 中关村东路1号 677400'
			}
		},
		{
			base: {
				codeholderType: 'human',
				newCode: 'zamlud',
				enabled: 0,
				feeCountry: 'pl',
				deathdate: '1917-04-14',
				isDead: 1
			},
			human: {
				firstNameLegal: 'Ludwik',
				lastNameLegal: 'Lejzer Zamenhof',
				honorific: 'D-ro',
				birthdate: '1859-12-15',
				profession: 'Okulkuracisto'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'sikmah',
				'feeCountry': 'af'
			},
			'human': {
				'firstNameLegal': 'Mahmud',
				'lastNameLegal': 'Sikandar',
				'honorific': 'S-ro'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'mcmnic',
				'feeCountry': 'ai'
			},
			'human': {
				'firstNameLegal': 'Nichola',
				'lastNameLegal': 'McMinn',
				'honorific': 'S-ino'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'kavkos',
				'feeCountry': 'al'
			},
			'human': {
				'firstNameLegal': 'Kostandin',
				'lastNameLegal': 'Kavaja',
				'honorific': 'D-ro'
			},
			'address': {
				'country': 'al',
				'city': 'TIRANA',
				city_latin: 'TIRANA',
				'streetAddress': 'Rruga Gaqo Vakeflli',
				'streetAddress_latin': 'Rruga Gaqo Vakeflli',
				search: 'AL ALBANIIO TIRANA Rruga Gaqo Vakeflli'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'refcai',
				'feeCountry': 'au'
			},
			'human': {
				'firstNameLegal': 'Caitlin',
				'lastNameLegal': 'Refshauge',
				'honorific': 'S-ino'
			},
			'address': {
				'country': 'au',
				'countryArea': 'QLD',
				'countryArea_latin': 'Queensland',
				'city': 'ASHMORE',
				'city_latin': 'ASHMORE',
				'streetAddress': '18 Sapium Rd',
				'streetAddress_latin': '18 Sapium Rd',
				'postalCode': '4214',
				'postalCode_latin': '4214',
				search: 'AU Aŭstralio QLD Queensland ASHMORE 18 Sapium Rd 4214'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'muxres',
				'feeCountry': 'az'
			},
			'human': {
				'firstNameLegal': 'Rəşad',
				'lastNameLegal': 'Muxtarov',
				'honorific': 'S-ro'
			},
			'address': {
				'country': 'az',
				'streetAddress': '12 Rashid Behbudov St',
				'streetAddress_latin': '12 Rashid Behbudov St',
				search: 'AZ Azerbajĝano 12 Rashid Behbudov St'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'hottar',
				'feeCountry': 'ba',
			},
			'human': {
				'firstNameLegal': 'Tarik',
				'lastNameLegal': 'Hot',
				'honorific': 'S-ro'
			},
			'address': {
				'country': 'ba',
				'city': 'SARAJEVO',
				'city_latin': 'SARAJEVO',
				'streetAddress': 'Stupska 6a',
				'streetAddress_latin': 'Stupska 6a',
				'postalCode': '71000',
				'postalCode_latin': '71000',
				search: 'BA Bosnio-Hercegovino SARAJEVO Stupska 6a 71000'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'chaboy',
				'feeCountry': 'bg'
			},
			'human': {
				'firstNameLegal': 'Boyko',
				'lastNameLegal': 'Chakarov',
				'honorific': 'S-ro'
			},
			'address': {
				'country': 'bg',
				'city': 'PLOVDIV',
				'city_latin': 'Plovdiv',
				'streetAddress': 'ul. "Chorlu" 16',
				'streetAddress_latin': 'ul. "Chorlu" 16',
				'postalCode': '4004',
				'postalCode_latin': '4004',
				search: 'BG Bulgario PLOVDIV ul. "Chorlu" 16 4004'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'khaaym',
				'feeCountry': 'bh'
			},
			'human': {
				'firstNameLegal': 'Ayman',
				'lastNameLegal': 'Khawaja',
				'honorific': 'S-ro'
			},
			'address': {
				'country': 'bh',
				'streetAddress': 'Building 852, Road 415, Block 704',
				'streetAddress_latin': 'Building 852, Road 415, Block 704',
				search: 'BH Barejno Building 852, Road 415, Block 704'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'oyaola',
				'feeCountry': 'bj'
			},
			'human': {
				'firstNameLegal': 'Olayinka',
				'lastNameLegal': 'Ọyáwálé',
				'honorific': 'S-ino'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'calmai',
				'feeCountry': 'bo'
			},
			'human': {
				'firstNameLegal': 'Mailin',
				'lastNameLegal': 'Calvillo López',
				'honorific': 'D-ro',
				'profession': 'Lingvisto'
			},
			'address': {
				'country': 'bo',
				'city': 'COCHABAMBA',
				'city_latin': 'Cochabamba',
				'streetAddress': 'Illapa 2118',
				'streetAddress_latin': 'Illapa 2118',
				search: 'BO Bolivio COCHABAMBA Illapa 2118'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'perrai',
				'feeCountry': 'br'
			},
			'human': {
				'firstNameLegal': 'Raissa',
				'lastNameLegal': 'Pereira Sousa',
				'honorific': 'S-ino'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'galabb',
				'feeCountry': 'bs'
			},
			'human': {
				'firstNameLegal': 'Abby',
				'lastNameLegal': 'Gallagher',
				'honorific': 'S-ino'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'seakag',
				'feeCountry': 'bw'
			},
			'human': {
				'firstNameLegal': 'Kagiso',
				'lastNameLegal': 'Seakanyeng',
				'honorific': 'S-ro'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'kahoma',
				'feeCountry': 'cd'
			},
			'human': {
				'firstNameLegal': 'Omari',
				'lastNameLegal': 'Kahinu',
				'honorific': 'S-ro'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'toujea',
				'feeCountry': 'cf'
			},
			'human': {
				'firstNameLegal': 'Jean-Bédel',
				'lastNameLegal': 'Touadéra'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'tsaiyi',
				'feeCountry': 'cn'
			},
			'human': {
				'firstNameLegal': 'Yi',
				'lastNameLegal': 'Tsai'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'guzzab',
				'feeCountry': 'co'
			},
			'human': {
				'firstNameLegal': 'Zaba',
				'lastNameLegal': 'Guzmán Roybal',
				'honorific': 'S-ino',
				birthdate: '1990-04-20'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'borfra',
				'feeCountry': 'cv'
			},
			'human': {
				'firstNameLegal': 'Francisco',
				'lastNameLegal': 'Borges Cunha',
				'honorific': 'F-lo'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'eleana',
				'feeCountry': 'cy'
			},
			'human': {
				'firstNameLegal': 'Anastasia',
				'lastNameLegal': 'Eleazar',
				'honorific': 'S-ino',
				'cellphone': '+35799967286'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'niclou',
				'feeCountry': 'cy'
			},
			'human': {
				'firstNameLegal': 'Louiza',
				'lastNameLegal': 'Nicolaou',
				'honorific': 'S-ino'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'prosof',
				'feeCountry': 'cy'
			},
			'human': {
				'firstNameLegal': 'Sofia',
				'lastNameLegal': 'Prodromou',
				'honorific': 'S-ino'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'rybnel',
				'feeCountry': 'cz'
			},
			'human': {
				'firstNameLegal': 'Nela',
				'lastNameLegal': 'Rybenská',
				'honorific': 'S-ino'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'larlar',
				'feeCountry': 'dk'
			},
			'human': {
				'firstNameLegal': 'Lars',
				'lastNameLegal': 'Larsen',
				'honorific': 'S-ro',
				'cellphone': '+4527220978'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'chamar',
				'feeCountry': 'dm'
			},
			'human': {
				'firstNameLegal': 'Mary',
				'lastNameLegal': 'Chambers',
				'honorific': 'S-ino'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'hundav',
				'feeCountry': 'dm'
			},
			'human': {
				'firstNameLegal': 'David',
				'lastNameLegal': 'Hunter',
				'honorific': 'S-ro'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'nasfat',
				'feeCountry': 'dz'
			},
			'human': {
				'firstNameLegal': 'Fatiha',
				'lastNameLegal': 'Nassiri',
				'honorific': 'S-ino'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'trejoo',
				'feeCountry': 'ee'
			},
			'human': {
				'firstNameLegal': 'Joonas',
				'lastNameLegal': 'Trei',
				'honorific': 'S-ro',
				'cellphone': '+3723528051',
				birthdate: '1920-03-02'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'mubmoh',
				'feeCountry': 'eg'
			},
			'human': {
				'firstNameLegal': 'Mohamed',
				'lastNameLegal': 'Mubarak',
				'honorific': 'S-ro'
			},
			'address': {
				'country': 'de',
				streetAddress: 'Henriettenstraße 1',
				streetAddress_latin: 'Henriettenstraße 1',
				city: 'BIELEFELD',
				city_latin: 'Bielefeld',
				postalCode: '33613',
				postalCode_latin: '33613',
				search: 'DE Germanio BIELEFELD 33613 Henriettenstraße 1'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'sukepe',
				'feeCountry': 'fj'
			},
			'human': {
				'firstNameLegal': 'Epeli',
				'lastNameLegal': 'Sukanaivalu',
				'honorific': 'S-ro'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'pantas',
				'feeCountry': 'fm'
			},
			'human': {
				'firstNameLegal': 'Tasi',
				'lastNameLegal': 'Pangelinan',
				'honorific': 'S-ino'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'tuckir',
				'feeCountry': 'gd'
			},
			'human': {
				'firstNameLegal': 'Kirani',
				'lastNameLegal': 'Tucker',
				'honorific': 'D-ro'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'reknat',
				'feeCountry': 'ge'
			},
			'human': {
				'firstNameLegal': 'Natia',
				'lastNameLegal': 'Rekhviashvili',
				'honorific': 'S-ino'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'barada',
				'feeCountry': 'gm'
			},
			'human': {
				'firstNameLegal': 'Adama',
				'lastNameLegal': 'Barrow',
				'honorific': 'S-ro'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'chaxue',
				'feeCountry': 'hk'
			},
			'human': {
				'firstNameLegal': 'Xue',
				'lastNameLegal': 'Chang',
				'honorific': 'S-ino'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'luqian',
				'feeCountry': 'hk'
			},
			'human': {
				'firstNameLegal': 'Qiang',
				'lastNameLegal': 'Lu',
				'honorific': 'S-ro'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'monszo',
				'feeCountry': 'hu',
				'officePhone': '+3635945821'
			},
			'human': {
				'firstNameLegal': 'Szőke',
				'lastNameLegal': 'Mónika',
				'honorific': 'S-ino',
				'landlinePhone': '+3692222048'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'surrat',
				'feeCountry': 'id'
			},
			'human': {
				'firstNameLegal': 'Ratna',
				'lastNameLegal': 'Surya',
				'honorific': 'S-ro'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'gilaoi',
				'feeCountry': 'ie'
			},
			'human': {
				'firstNameLegal': 'Aoife',
				'lastNameLegal': 'Gilpatrick',
				'honorific': 'D-ro'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'macorf',
				'feeCountry': 'ie'
			},
			'human': {
				'firstNameLegal': 'Órfhlaith',
				'lastNameLegal': 'Mac Gaoithín',
				'honorific': 'S-ino',
				'profession': 'Kantistino'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'habfar',
				'feeCountry': 'ir'
			},
			'human': {
				'firstNameLegal': 'Farid',
				'lastNameLegal': 'Habibi',
				'honorific': 'S-ro'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'katgoi',
				'feeCountry': 'jp'
			},
			'human': {
				'firstNameLegal': 'Gouki',
				'lastNameLegal': 'Katagari',
				'honorific': 'S-ro'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'agatak',
				'feeCountry': 'jp'
			},
			'human': {
				'firstNameLegal': 'Taketo',
				'lastNameLegal': 'Agano',
				'honorific': 'D-ro'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'hosken',
				'feeCountry': 'jp'
			},
			'human': {
				'firstNameLegal': 'Kensaku',
				'lastNameLegal': 'Hoshino',
				'honorific': 'S-ro'
			}
		},
		{
			'base': {
				'codeholderType': 'human',
				'newCode': 'zhueld',
				'feeCountry': 'kg'
			},
			'human': {
				'firstNameLegal': 'Eldar',
				'lastNameLegal': 'Zhunusov',
				'honorific': 'S-ro'
			}
		}
	];

	for (const codeholder of codeholders) {
		const insertReturn = await AKSO.db('codeholders')
			.insert({
				creationTime: moment().unix(),
				...codeholder.base
			});
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
