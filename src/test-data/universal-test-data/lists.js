export async function createLists () {
	await AKSO.db('lists')
		.insert([
			/*eslint-disable */
			{"id":"1","name":"Komitato (TEJO)","description":"Ĉiuj Komitatanoj (A, B, C kaj Ĉ) de TEJO","filters":"[\"{\\\"$roles\\\":{\\\"roleId\\\":3,\\\"isActive\\\":true}}\", \"{\\\"$roles\\\":{\\\"roleId\\\":4,\\\"isActive\\\":true}}\", \"{\\\"$roles\\\":{\\\"roleId\\\":5,\\\"isActive\\\":true}}\", \"{\\\"$roles\\\":{\\\"roleId\\\":6,\\\"isActive\\\":true}}\"]","memberFilter":"{}"},
			{"id":"2","name":"Komitato (UEA)","description":"Ĉiuj Komitatanoj (A, B kaj C) de UEA","filters":"[\"{\\\"$roles\\\":{\\\"roleId\\\":11,\\\"isActive\\\":true}}\", \"{\\\"$roles\\\":{\\\"roleId\\\":12,\\\"isActive\\\":true}}\", \"{\\\"$roles\\\":{\\\"roleId\\\":13,\\\"isActive\\\":true}}\"]","memberFilter":"{}"}
			/*eslint-enable */
		]);
}
