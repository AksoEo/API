import AKSOCurrency from 'akso/lib/enums/akso-currency';

const formEntryInputProps = {
	el: {
		type: 'string',
		const: 'input'
	},
	name: {
		type: 'string',
		minLength: 1,
		maxLength: 20
	},
	oldName: {
		type: 'string',
		minLength: 1,
		maxLength: 20
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
			{ type: 'object' },
			{ type: 'boolean' }
		]
	},
	disabled: {
		oneOf: [
			{ type: 'object' },
			{ type: 'boolean' }
		]
	},
	hideIfDisabled: {
		type: 'boolean',
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
	minItems: 1,
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
						maxLength: 10000
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
					script: {
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
									{ type: 'object' },
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
									{ type: 'object' },
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
									{ type: 'object' },
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
								format: 'regex',
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
								enum: [
									null, 'birthdate', 'email', 'officePhone', 'cellphone',
									'landlinePhone', 'phone', 'website', 'profession',
									'name', 'honorific', 'firstName', 'lastName', 'address',
									'feeCountry', 'country', 'countryArea', 'city',
									'cityArea', 'streetAddress', 'postalCode', 'sortingCode'
								],
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
									{ type: 'object' },
									{
										type: 'integer',
										format: 'uint32'
									},
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
					{ // FormEntryInputEnum
						type: 'object',
						properties: {
							...formEntryInputProps,
							type: {
								type: 'string',
								const: 'enum'
							},
							default: {
								oneOf: [
									{ type: 'object' },
									{ type: 'string' },
									{ type: 'null' }
								]
							},
							variant: {
								type: 'string',
								enum: [ 'select', 'radio' ]
							},
							options: {
								type: 'array',
								minItems: 1,
								maxItems: 256,
								items: {
									type: 'object',
									properties: {
										name: {
											type: 'string',
											minLength: 1,
											maxLength: 50,
											pattern: '^[^\\n]+$'
										},
										value: {
											type: 'string',
											minLength: 1,
											maxLength: 255,
											pattern: '^[^\\n]+$'
										},
										disabled: {
											oneOf: [
												{ type: 'boolean' },
												{
													type: 'string',
													const: 'onlyExisting'
												}
											]
										}
									},
									required: [ 'name', 'value' ],
									additionalProperties: false
								}
							}
						},
						required: formEntryInputRequiredProps.concat(['variant', 'options']),
						additionalProperties: false
					},
					{ // FormEntryInputCountry
						type: 'object',
						properties: {
							...formEntryInputProps,
							type: {
								type: 'string',
								const: 'country'
							},
							default: {
								oneOf: [
									{ type: 'object' },
									{ type: 'null' },
									{ type: 'string' }
								]
							},
							exclude: {
								type: 'array',
								maxItems: 300,
								items: {
									type: 'string',
									pattern: '^[a-z]{2,3}$'
								}
							},
							chAutofill: {
								enum: [ null, 'country', 'feeCountry' ]
							}
						},
						required: formEntryInputRequiredProps,
						additionalProperties: false
					},
					{ // FormEntryInputDate
						type: 'object',
						properties: {
							...formEntryInputProps,
							type: {
								type: 'string',
								const: 'date'
							},
							default: {
								oneOf: [
									{ type: 'object' },
									{ type: 'string', format: 'date' },
									{ type: 'null' }
								]
							},
							min: {
								type: 'string',
								format: 'date',
								nullable: true
							},
							max: {
								type: 'string',
								format: 'date',
								nullable: true
							},
							chAutofill: {
								enum: [ null, 'birthdate' ]
							}
						},
						required: formEntryInputRequiredProps,
						additionalProperties: false
					},
					{ // FormEntryInputTime
						type: 'object',
						properties: {
							...formEntryInputProps,
							type: {
								type: 'string',
								const: 'time'
							},
							default: {
								oneOf: [
									{ type: 'object' },
									{
										type: 'string',
										format: 'short-time'
									},
									{ type: 'null' }
								]
							},
							min: {
								type: 'string',
								format: 'short-time',
								nullable: true
							},
							max: {
								type: 'string',
								format: 'short-time',
								nullable: true
							}
						},
						required: formEntryInputRequiredProps,
						additionalProperties: false
					},
					{ // FormEntryInputDatetime
						type: 'object',
						properties: {
							...formEntryInputProps,
							type: {
								type: 'string',
								const: 'datetime'
							},
							default: {
								oneOf: [
									{ type: 'object' },
									{ type: 'integer', format: 'uint64' },
									{ type: 'null' }
								]
							},
							tz: {
								type: 'string',
								format: 'tz',
								nullable: true
							},
							min: {
								type: 'integer',
								format: 'uint64',
								nullable: true
							},
							max: {
								type: 'string',
								format: 'uint64',
								nullable: true
							}
						},
						required: formEntryInputRequiredProps,
						additionalProperties: false
					},
					{ // FormEntryInputBooleanTable
						type: 'object',
						properties: {
							...formEntryInputProps,
							type: {
								type: 'string',
								const: 'boolean_table'
							},
							default: {
								oneOf: [
									{ type: 'object' },
									{ type: 'boolean' },
									{ type: 'null' }
								]
							},
							cols: {
								type: 'integer',
								maximum: 20
							},
							rows: {
								type: 'integer',
								maximum: 20
							},
							minSelect: {
								type: 'integer',
								format: 'uint8',
								nullable: true
							},
							maxSelect: {
								type: 'integer',
								format: 'uint8',
								minimum: 1,
								nullable: true
							},
							headerTop: {
								type: 'array',
								nullable: true,
								items: {
									type: 'string',
									minLength: 1,
									maxLength: 20,
									pattern: '^[^\\n]+$',
									nullable: true
								}
							},
							headerLeft: {
								type: 'array',
								nullable: true,
								items: {
									type: 'string',
									minLength: 1,
									maxLength: 20,
									pattern: '^[^\\n]+$',
									nullable: true
								}
							},
							excludeCells: {
								type: 'array',
								maxItems: 400,
								items: {
									type: 'array',
									minItems: 2,
									maxItems: 2,
									items: {
										type: 'integer',
										minimum: 0,
										maximum: 19
									}
								}
							}
						},
						required: formEntryInputRequiredProps.concat(['cols','rows']),
						additionalProperties: false
					}
				]
			}
		]
	}
};
