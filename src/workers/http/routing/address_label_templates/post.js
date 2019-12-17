import path from 'path';

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
					additionalProperties: false,
					default: {
						top: 72,
						bottom: 72,
						left: 72,
						right: 72
					}
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
			required: [
				'name', 'cols', 'rows', 'colGap', 'rowGap'
			],
			additionalProperties: false
		},
		requirePerms: 'address_label_templates.create'
	},

	run: async function run (req, res) {
		const data = req.body;
		data.margins = JSON.stringify(data.margins);

		const id = (await AKSO.db('addressLabelTemplates').insert(data))[0];

		res.set('Location', path.join(AKSO.conf.http.path, '/address_label_templates/', id.toString()));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
