export default {
	type: 'array',
	minItems: 2,
	maxItems: 2,
	items: [
		{
			type: 'number',
			minimum: -90,
			maximum: 90
		},
		{
			type: 'number',
			minimum: -180,
			maximum: 180
		}
	]
};
