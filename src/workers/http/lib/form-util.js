import AKSOCurrency from 'akso/lib/enums/akso-currency';
import { analyze, analyzeAll, UnionType, ConcreteType } from '@tejo/akso-script';

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
									{ type: 'string' }, // TODO: Make sure this is a valid option
									{ type: 'null' }
								]
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
							add: {
								type: 'array',
								maxItems: 100,
								items: {
									type: 'object',
									properties: {
										name: {
											type: 'string',
											minLength: 1,
											maxLength: 50,
											pattern: '^[^\\n]+$'
										},
										code: {
											type: 'string',
											pattern: '^_[a-z]{1,2}$'
										} // TODO: Remove dupes
									},
									required: [ 'name', 'code' ],
									additionalProperties: false
								}
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
								type: 'string',
								enum: [ 'country' ],
								nullable: true
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
								type: 'string',
								enum: [ 'birthdate' ],
								nullable: true
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
										format: 'time',
										pattern: '^\\d{2}:\\d{2}$' },
									{ type: 'null' }
								]
							},
							min: {
								type: 'string',
								format: 'time',
								pattern: '^\\d\\d?:\\d\\d$',
								nullable: true
							},
							max: {
								type: 'string',
								format: 'time',
								pattern: '^\\d\\d?:\\d\\d$',
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

export function parseForm (form, formValues = {}) {
	const fields = [];

	let scripts = {};
	formValues = {
		...formValues,
		'@created_time': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.NUMBER)
		]),
		'@edited_time': new UnionType([
			new ConcreteType(ConcreteType.types.NULL),
			new ConcreteType(ConcreteType.types.NUMBER)
		])
	};
	const getFormValue = key => {
		return formValues[key.normalize('NFC')];
	};

	const validatePropExpr = function (i, formEntry, prop) {
		const symb = Symbol(prop);
		const exprScripts = {
			...scripts,
			[symb]: formEntry[prop]
		};
		let analysis;
		try {
			analysis = analyze(exprScripts, symb, getFormValue);
		} catch {
			throw new Error(`The AKSO Script expression in #${prop} in the form entry at pos ${i} caused a generic error (might be a stack overflow)`);
		}
		if (!analysis.valid) {
			throw new Error(`The AKSO Script expression in #${prop} in the form entry at pos ${i} errored with ${JSON.stringify(analysis.error)}`);
		}
	};

	const inputNameRegex = /^[\w\-:ĥŝĝĉĵŭ]+$/i;
	for (const [i, formEntry] of Object.entries(form)) {
		if (formEntry.el === 'input') {
			formEntry.name = formEntry.name.normalize('NFC');
			if (!inputNameRegex.test(formEntry.name)) {
				throw new Error('Invalid FormEntryInput#name');
			}
			if (fields.includes(formEntry.name)) {
				throw new Error('Duplicate FormEntryInput with name ' + formEntry.name);
			}
			fields.push(formEntry.name);

			// Form values
			if (formEntry.type === 'boolean') {
				formValues[formEntry.name] = new ConcreteType(ConcreteType.types.BOOL);
			} else if (['number', 'money', 'datetime'].includes(formEntry.type)) {
				formValues[formEntry.name] = new UnionType([
					new ConcreteType(ConcreteType.types.NULL),
					new ConcreteType(ConcreteType.types.NUMBER)
				]);
			} else if (['text', 'enum', 'country', 'date', 'time'].includes(formEntry.type)) {
				formValues[formEntry.name] = new UnionType([
					new ConcreteType(ConcreteType.types.NULL),
					new ConcreteType(ConcreteType.types.STRING)
				]);
			} else if (formEntry.type === 'boolean_table') {
				formValues[formEntry.name] = new ConcreteType(
					ConcreteType.types.ARRAY,
					new UnionType([
						new ConcreteType(ConcreteType.types.NULL),
						new ConcreteType(ConcreteType.types.BOOL)
					])
				);
			}

			// AKSO Script expressions
			const props = [
				'required',
				'disabled',
				'default'
			];
			for (const prop of props) {
				if (formEntry[prop] && typeof formEntry[prop] === 'object') {
					validatePropExpr(i, formEntry, prop);
				}
			}

			// Defaults and per type validation
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

				if (typeof formEntry.default === 'string') {
					if (formEntry.variant === 'textarea') {
						if (formEntry.default.length > 8192) {
							throw new Error('default exceeds 8192 chars in formEntry' + formEntry.name);
						}
						if (formEntry.default.includes('\n')) {
							throw new Error('default must not contain newlines in formEntry ' + formEntry.name);
						}
					} else {
						if (formEntry.default.length > 2048) {
							throw new Error('default exceeds 2048 chars in formEntry' + formEntry.name);
						}
					}
				}

				if (!('placeholder' in formEntry)) { formEntry.placeholder = null; }
				if (!('pattern' in formEntry)) { formEntry.pattern = null; }
				if (!('patternError' in formEntry)) { formEntry.patternError = null; }
				if (!('minLength' in formEntry)) { formEntry.minLength = null; }
				if (!('maxLength' in formEntry)) { formEntry.maxLength = null; }
				if (!('chAutofill' in formEntry)) { formEntry.chAutofill = null; }
			} else if (formEntry.type === 'enum') {
				if (!('minSelect' in formEntry)) { formEntry.minSelect = null; }
				if (!('maxSelect' in formEntry)) { formEntry.maxSelect = null; }

				for (const opt of formEntry.options) {
					if (!('disabled' in opt)) { opt.disabled = false; }
				}

				if (typeof formEntry.default === 'string') {
					const optValues = formEntry.options.map(x => x.value);
					if (!optValues.includes(formEntry.default)) {
						throw new Error('Invalid default in formEntry ' + formEntry.name);
					}
				}
			} else if (formEntry.type === 'country') {
				if (!('minSelect' in formEntry)) { formEntry.minSelect = null; }
				if (!('maxSelect' in formEntry)) { formEntry.maxSelect = null; }
				if (!('add' in formEntry)) { formEntry.add = []; }
				if (!('exclude' in formEntry)) { formEntry.exclude = []; }
				if (!('chAutofill' in formEntry)) { formEntry.chAutofill = null; }
			} else if (formEntry.type === 'date') {
				if (!('min' in formEntry)) { formEntry.min = null; }
				if (!('max' in formEntry)) { formEntry.max = null; }
				if (!('chAutofill' in formEntry)) { formEntry.chAutofill = null; }
			} else if (formEntry.type === 'time') {
				if (!('min' in formEntry)) { formEntry.min = null; }
				if (!('max' in formEntry)) { formEntry.max = null; }
			} else if (formEntry.type === 'datetime') {
				if (!('tz' in formEntry)) { formEntry.tz = null; }
				if (!('min' in formEntry)) { formEntry.min = null; }
				if (!('max' in formEntry)) { formEntry.max = null; }
			} else if (formEntry.type === 'boolean_table') {
				if (!('minSelect' in formEntry)) { formEntry.minSelect = null; }
				if (!('maxSelect' in formEntry)) { formEntry.maxSelect = null; }
				if (!('headerTop' in formEntry)) { formEntry.headerTop = null; }
				if (!('headerLeft' in formEntry)) { formEntry.headerLeft = null; }
				if (!('excludeCells' in formEntry)) { formEntry.excludeCells = null; }

				if (formEntry.headerTop && formEntry.headerTop.length !== formEntry.cols) {
					throw new Error(`headerTop in formEntry ${formEntry.name} must have as many items as it has columns`);
				}
				if (formEntry.headerLeft && formEntry.headerLeft.length !== formEntry.cols) {
					throw new Error(`headerLeft in formEntry ${formEntry.name} must have as many items as it has columns`);
				}
			}
		} else if (formEntry.el === 'script') {
			scripts = { ...scripts, ...formEntry.script };
			let analyses;
			try {
				analyses = analyzeAll(scripts, getFormValue);
			} catch (e) {
				throw new Error(`The AKSO Script at pos ${i} caused a generic error (might be a stack overflow)`);
			}
			for (const [def, analysis] of Object.entries(analyses)) {
				if (!analysis.valid) {
					throw new Error(`The definition for ${def} in the AKSO Script at pos ${i} errored with ${JSON.stringify(analysis.error)}`);
				}
			}
		}
	}
}
