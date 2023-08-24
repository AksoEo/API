import { ajv } from 'akso/lib/ajv';
import { evaluateSync, doAscMagic } from 'akso/lib/akso-script-util';

export async function validateDataEntry ({
	formData,
	data,
	oldData = undefined,
	addFormValues = {},
	allowInvalidData = false,
} = {}) {
	// Make sure all fields are present
	for (const formEntry of formData.form) {
		if (formEntry.el === 'input') {
			const name = formEntry.name;
			if (!(name in data)) {
				const err = new Error('Missing required field data.' + name);
				err.statusCode = 400;
				throw err;
			}
		}
	}

	await doAscMagic();

	const aksoCountries = (await AKSO.db('countries').select('code'))
		.map(x => x.code);

	// Build the schema
	const dataSchema = {
		type: 'object',
		properties: {},
		required: [],
		additionalProperties: false
	};

	const getBasicFieldSchema = formEntry => {
		switch (formEntry.type) {
		case 'boolean': return {
			type: 'boolean'
		};
		case 'number': return {
			type: 'number'
		};
		case 'text':
			if (formEntry.variant === 'textarea') {
				return {
					type: 'string',
					minLength: 1,
					maxLength: 8192
				};
			} else {
				const baseSchema = {
					type: 'string',
					minLength: 1,
					maxLength: 2048,
					pattern: '^[^\\n]+$'
				};
				if (formEntry.variant === 'email') { baseSchema.format = 'email'; }
				if (formEntry.variant === 'tel') { baseSchema.format = 'tel'; }
				if (formEntry.variant === 'uri') { baseSchema.format = 'safe-uri'; }
				return baseSchema;
			}
		case 'money': return {
			type: 'number',
			format: 'uint32'
		};
		case 'enum': return {
			type: 'string',
			enum: formEntry.options
				.filter(x => {
					if (allowInvalidData) return true;
					if (x.disabled === true) return false;
					if (x.disabled === 'onlyExisting') {
						if (!oldData) return false;
						if (oldData[formEntry.name] !== x.value) return false;
					}
					return true;
				})
				.map(x => x.value)
		};
		case 'country': return {
			type: 'string',
			enum: aksoCountries.filter(x => !formEntry.exclude.includes(x))
		};
		case 'date': return {
			type: 'string',
			format: 'date'
		};
		case 'time': return {
			type: 'string',
			format: 'short-time'
		};
		case 'datetime': return {
			type: 'number',
			format: 'int64'
		};
		case 'boolean_table':
			const items = []; // rows
			for (let x = 0; x < formEntry.cols; x++) {
				const colItems = [];
				for (let y = 0; y < formEntry.rows; y++) {
					colItems[y] = {
						type: 'boolean',
					};
				}
				items[x] = { // cols
					type: 'array',
					items: colItems,
					minItems: formEntry.cols,
					maxItems: formEntry.cols,
				};
			}
			for (const cell of formEntry.excludeCells ?? []) {
				const [y, x] = cell;
				if (items[x] && items[x].items[y]) {
					items[x].items[y] = { type: 'null' };
				}
			}
			return { // full bool table
				type: 'array',
				items: items,
				minItems: formEntry.rows,
				maxItems: formEntry.rows,
			};
		}
	};
	let scripts = [];
	const formValues = {
		...addFormValues,
		...data
	};
	const getFormValue = key => {
		return formValues[key.normalize('NFC')];
	};
	const getComputedProp = (formEntry, prop) => {
		const propVal = formEntry[prop];
		if (propVal === null) { return null; }
		if (typeof propVal !== 'object') { return propVal; }

		const symb = Symbol(prop);
		const exprScripts = [
			...scripts,
			{ [symb]: formEntry[prop] }
		];
		return evaluateSync(exprScripts, symb, getFormValue);
	};

	const getFieldSchema = formEntry => {
		const fieldSchema = getBasicFieldSchema(formEntry);
		if (allowInvalidData) {
			return {
				oneOf: [
					{
						type: 'null'
					},
					fieldSchema
				]
			};
		}

		const disabled = getComputedProp(formEntry, 'disabled');
		if (disabled) { return { type: 'null' }; }

		const required = getComputedProp(formEntry, 'required');

		if (oldData && !formEntry.editable) {
			fieldSchema.const = oldData[formEntry.name];
		}

		if (['date','datetime','time'].includes(formEntry.type)) {
			if (formEntry.min !== null) { fieldSchema.formatMinimum = formEntry.min; }
			if (formEntry.max !== null) { fieldSchema.formatMaximum = formEntry.max; }
		} else if (['number','money'].includes(formEntry.type)) {
			if (formEntry.min !== null) { fieldSchema.minimum = formEntry.min; }
			if (formEntry.max !== null) { fieldSchema.maximum = formEntry.max; }
			if (formEntry.step !== null) { fieldSchema.multipleOf = formEntry.step; }
		} else if (formEntry.type === 'text') {
			if (formEntry.pattern !== null) { fieldSchema.pattern = formEntry.pattern; }
			if (formEntry.minLength !== null) { fieldSchema.minLength = formEntry.minLength; }
			if (formEntry.maxLength !== null) { fieldSchema.maxLength = formEntry.maxLength; }
		} else if (formEntry.type === 'boolean') {
			if (required) { fieldSchema.const = true; }
		} else if (formEntry.type === 'boolean_table') {
			fieldSchema.validateFunction = function (val) {
				if (!Array.isArray(val)) { return false; }
				const numValues = []
					.concat(...val)
					.filter(x => x === true)
					.length;
				if (formEntry.minSelect !== null) {
					if (numValues < formEntry.minSelect) { return false; }
				}
				if (formEntry.maxSelect !== null) {
					if (numValues > formEntry.maxSelect) { return false; }
				}
				return true;
			};
		}

		if (!required) {
			return {
				oneOf: [
					{
						type: 'null'
					},
					fieldSchema
				]
			};
		}

		return fieldSchema;
	};

	for (const formEntry of formData.form) {
		if (formEntry.el === 'input') {
			const name = formEntry.name;
			dataSchema.properties[name] = getFieldSchema(formEntry);
		} else if (formEntry.el === 'script') {
			scripts.push(formEntry.script);
		}
	}

	const validateSchema = ajv.compile(dataSchema);
	if (!validateSchema(data)) {
		const err = new Error(JSON.stringify(validateSchema.errors));
		err.statusCode = 400;
		throw err;
	}

	const metadata = {
		evaluate: function (def) { return evaluateSync(scripts, def, getFormValue); }
	};

	return metadata;
}
