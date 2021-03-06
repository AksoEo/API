export async function createAddressLabelTemplates () {
	await AKSO.db('addressLabelTemplates')
		.insert([
			{
				name: 'A4-test',
				paper: 'A4',
				margins: JSON.stringify({
					top: 72,
					left: 72,
					right: 72,
					bottom: 72
				}),
				cols: 2,
				rows: 5,
				colGap: 72,
				rowGap: 72,
				cellPadding: 8,
				fontSize: 12,
				drawOutline: 0
			}
		]);
}
