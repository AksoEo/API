import AKSOCurrency from 'akso/lib/enums/akso-currency';

const formEntryInputProps = {
	el: {
		type: 'string',
		const: 'input'
	},
	name: {
		type: 'string',
		minLength: 1,
		maxLength: 20,
		pattern: '^[^\\n]+$'
	},
	label: {
		type: 'string',
		minLength: 1,
		maxLength: 80,
		pattern: '^[^\\n]+$'
	},
	description: {
		type: 'string',
		minLength: 1,
		maxLength: 2000,
		nullable: true
	},
	required: {
		oneOf: [
			{ type: 'object' }, // TODO: Validate scripts
			{ type: 'boolean' }
		]
	},
	disabled: {
		oneOf: [
			{ type: 'object' }, // TODO: Validate scripts
			{ type: 'boolean' }
		]
	},
	editable: {
		type: 'boolean'
	}
};
const formEntryInputRequiredProps = [
	'el',
	'name',
	'label',
	'type'
];

export const formSchema = {
	type: 'array',
	maxItems: 256,
	items: {
		oneOf: [
			{ // FormEntryText
				type: 'object',
				properties: {
					el: {
						type: 'string',
						const: 'text'
					},
					text: {
						type: 'string',
						minLength: 1,
						maxLength: 5000
					}
				},
				required: [
					'el',
					'text'
				],
				additionalProperties: false
			},
			{ // FormEntryScript
				type: 'object',
				properties: {
					el: {
						type: 'string',
						const: 'script'
					},
					script: { // TODO: Validate scripts
						type: 'object'
					}
				},
				required: [
					'el',
					'script'
				],
				additionalProperties: false
			},
			{ // FormEntryInput
				oneOf: [
					{ // FormEntryInputBoolean
						type: 'object',
						properties: {
							...formEntryInputProps,
							type: {
								type: 'string',
								const: 'boolean'
							},
							default: {
								oneOf: [
									{ type: 'object' }, // TODO: Validate scripts
									{ type: 'boolean' },
									{ type: 'null' }
								]
							}
						},
						required: formEntryInputRequiredProps,
						additionalProperties: false
					},
					{ // FormEntryInputNumber
						type: 'object',
						properties: {
							...formEntryInputProps,
							type: {
								type: 'string',
								const: 'number'
							},
							default: {
								oneOf: [
									{ type: 'object' }, // TODO: Validate scripts
									{ type: 'number' },
									{ type: 'null' }
								]
							},
							placeholder: {
								type: 'string',
								minLength: 1,
								maxLength: 50,
								pattern: '^[^\\n]+$',
								nullable: true
							},
							step: {
								type: 'number',
								exclusiveMinimum: 0,
								nullable: true
							},
							min: {
								type: 'number',
								nullable: true
							},
							max: {
								type: 'number',
								nullable: true
							},
							variant: {
								type: 'string',
								enum: [ 'input', 'slider' ]
							}
						},
						required: formEntryInputRequiredProps.concat(['variant']),
						additionalProperties: false
					},
					{ // FormEntryInputText
						type: 'object',
						properties: {
							...formEntryInputProps,
							type: {
								type: 'string',
								const: 'text'
							},
							default: {
								oneOf: [
									{ type: 'object' }, // TODO: Validate scripts
									{ type: 'string' },
									{ type: 'null' }
								]
							},
							placeholder: {
								type: 'string',
								minLength: 1,
								maxLength: 50,
								pattern: '^[^\\n]+$',
								nullable: true
							},
							pattern: {
								type: 'string',
								minLength: 1,
								maxLength: 150,
								nullable: true
							},
							patternError: {
								type: 'string',
								minLength: 1,
								maxLength: 200,
								nullable: true
							},
							minLength: {
								type: 'integer',
								format: 'uint32',
								nullable: true
							},
							maxLength: {
								type: 'integer',
								format: 'uint32',
								nullable: true
							},
							variant: {
								type: 'string',
								enum: [
									'text', 'textarea', 'email', 'tel', 'uri'
								]
							},
							chAutofill: {
								type: 'string',
								enum: [
									'birthdate', 'email', 'officePhone', 'cellphone',
									'landlinePhone', 'phone', 'website', 'profession',
									'name', 'honorific', 'firstName', 'lastName', 'address',
									'countryCode', 'countryArea', 'city', 'cityArea',
									'streetAddress', 'postalCode', 'sortingCode'
								],
								nullable: true
							}
						},
						required: formEntryInputRequiredProps.concat(['variant']),
						additionalProperties: false
					},
					{ // FormEntryInputMoney
						type: 'object',
						properties: {
							...formEntryInputProps,
							type: {
								type: 'string',
								const: 'money'
							},
							default: {
								oneOf: [
									{ type: 'object' }, // TODO: Validate scripts
									{ type: 'number' },
									{ type: 'null' }
								]
							},
							placeholder: {
								type: 'string',
								minLength: 1,
								maxLength: 50,
								pattern: '^[^\\n]+$',
								nullable: true
							},
							step: {
								type: 'number',
								exclusiveMinimum: 0,
								nullable: true
							},
							min: {
								type: 'number',
								nullable: true
							},
							max: {
								type: 'number',
								nullable: true
							},
							currency: {
								type: 'string',
								enum: AKSOCurrency.all
							}
						},
						required: formEntryInputRequiredProps.concat(['currency']),
						additionalProperties: false
					},
					// TODO: enum and later
				]
			}
		]
	}
};

export function parseForm (form) {
	const fields = [];

	for (const formEntry of form) {
		if (formEntry.el === 'input') {
			if (fields.includes(formEntry.name)) {
				throw new Error('Duplicate FormEntryInput with name ' + formEntry.name);
			}
			fields.push(formEntry.name);

			// Defaults
			if (!('description' in formEntry)) { formEntry.description = null; }
			if (!('default' in formEntry)) { formEntry.default = null; }
			if (!('required' in formEntry)) { formEntry.required = false; }
			if (!('disabled' in formEntry)) { formEntry.disabled = false; }

			if (formEntry.type === 'number' || formEntry.type === 'money') {
				if (!('placeholder' in formEntry)) { formEntry.placeholder = null; }
				if (!('step' in formEntry)) { formEntry.step = null; }
				if (!('min' in formEntry)) { formEntry.min = null; }
				if (!('max' in formEntry)) { formEntry.max = null; }
			} else if (formEntry.type === 'text') {
				if ('pattern' in formEntry) {
					try {
						new RegExp(formEntry.pattern);
					} catch (e) {
						throw new Error('Invalid pattern in formEntry ' + formEntry.name);
					}
				}

				if (!('placeholder' in formEntry)) { formEntry.placeholder = null; }
				if (!('pattern' in formEntry)) { formEntry.pattern = null; }
				if (!('patternError' in formEntry)) { formEntry.patternError = null; }
				if (!('minLength' in formEntry)) { formEntry.minLength = null; }
				if (!('maxLength' in formEntry)) { formEntry.maxLength = null; }
				if (!('chAutofill' in formEntry)) { formEntry.chAutofill = null; }
			}
		}
	}
}
