export const schema = {
	defaultFields: [ 'id' ],
	fields: {
		id: 'f',
		title: 'fs',
		description: 's',
		owner: '',
		timeFrom: 'f',
		timeTo: 'f',
		location: 'f',
		tags: '',
	},
	fieldAliases: {
		tags: () => AKSO.db.raw('1'),
	},
	alwaysSelect: [ 'id' ],
	customFilterCompOps: {
		$hasAny: {
			tags: (query, arr) => {
				query.whereExists(function () {
					this.select(1)
						.from('congresses_instances_programs_tags')
						.whereRaw('congresses_instances_programs_tags.congressInstanceProgramId = congresses_instances_programs.id')
						.whereIn('congressInstanceProgramTagId', arr);
				});
			},
		},
	},
};

export async function afterQuery (arr, done) {
	if (!arr.length) { return done(); }

	const ids = arr.map(row => row.id);

	if (arr[0].tags) {
		const tagsArr = await AKSO.db('congresses_instances_programs_tags')
			.innerJoin('congresses_instances_programTags', 'congresses_instances_programs_tags.congressInstanceProgramTagId', 'congresses_instances_programTags.id')
			.select('congresses_instances_programTags.id', 'name', 'congressInstanceProgramId')
			.whereIn('congressInstanceProgramId', ids)
			.orderBy('congressInstanceProgramId');
		for (const row of arr) {
			row.tags = [];
			let foundFirstTag = false;
			for (const programTag of tagsArr) {
				if (programTag.congressInstanceProgramId !== row.id) {
					if (foundFirstTag) { break; }
					continue;
				}
				foundFirstTag = true;
				row.tags.push({
					id: programTag.id,
					name: programTag.name,
				});
			}
		}
	}

	done();
}
