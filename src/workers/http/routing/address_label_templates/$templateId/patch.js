export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 50,
					pattern: '^[^\\n]+$'
				},
				paper: {
					type: 'string',
					enum: [ 'A3', 'A4', 'A5', 'LETTER', 'FOLIO', 'LEGAL', 'EXECUTIVE' ]
				},
				margins: {
					type: 'object',
					properties: {
						top: {
							type: 'number',
							format: 'uint16'
						},
						bottom: {
							type: 'number',
							format: 'uint16'
						},
						left: {
							type: 'number',
							format: 'uint16'
						},
						right: {
							type: 'number',
							format: 'uint16'
						}
					},
					required: [ 'top', 'bottom', 'left', 'right' ],
					additionalProperties: false
				},
				cols: {
					type: 'integer',
					minimum: 1,
					maximum: 20
				},
				rows: {
					type: 'integer',
					minimum: 1,
					maximum: 50
				},
				colGap: {
					type: 'number',
					format: 'uint16'
				},
				rowGap: {
					type: 'number',
					format: 'uint16'
				},
				cellPadding: {
					type: 'number',
					format: 'uint16'
				},
				fontSize: {
					type: 'integer',
					minimum: 8,
					maximum: 30
				},
				drawOutline: {
					type: 'boolean'
				}
			},
			minProperties: 1,
			additionalProperties: false
		},
		requirePerms: 'address_label_templates.update'
	},

	run: async function run (req, res) {
		const data = req.body;
		if ('margins' in data) {
			data.margins = JSON.stringify(data.margins);
		}

		const updated = await AKSO.db('addressLabelTemplates')
			.where('id', req.params.templateId)
			.update(data);

		res.sendStatus(updated ? 204 : 404);
	}
};
