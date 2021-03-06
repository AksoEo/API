export async function createClients () {
	await AKSO.db('clients').insert([
		{
			apiKey: Buffer.from('0e5417fdf9edb4667ccd6de525300bd8', 'hex'),
			apiSecret: Buffer.from('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', 'hex'),
			name: 'Test app (p: test)',
			ownerName: 'TEJO',
			ownerEmail: 'mia@tejo.org'
		}
	]);
}
