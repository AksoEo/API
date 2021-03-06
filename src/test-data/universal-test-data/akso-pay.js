export async function createAKSOPay () {
	await AKSO.db('pay_orgs')
		.insert([
			{
				id: 1,
				org: 'tejo',
				name: 'IJK 2020',
				description: 'Internacia Junulara Kongreso 2020'
			},
			{
				id: 2,
				org: 'uea',
				name: 'UEA'
			},
			{
				id: 3,
				org: 'tejo',
				name: 'TEJO'
			}
		]);

	await AKSO.db('pay_methods')
		.insert([
			{
				paymentOrgId: 1,
				type: 'manual',
				name: 'Permana-testo',
				currencies: 'EUR,JPY,USD,DKK'
			},
			{
				paymentOrgId: 2,
				type: 'manual',
				name: 'Permana-testo',
				currencies: 'EUR,JPY,USD,DKK'
			},
			{
				paymentOrgId: 3,
				type: 'manual',
				name: 'Permana-testo',
				currencies: 'EUR,JPY,USD,DKK'
			}
		]);

	await AKSO.db('pay_addons')
		.insert([
			{
				id: 1,
				paymentOrgId: 2,
				name: 'Ĝenerala kaso de UEA'	
			}
		]);
}
