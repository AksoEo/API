import { analyze, analyzeAll, union, NULL, NUMBER, BOOL, STRING, array as ascArray } from '@tejo/akso-script';

export async function parseForm (form, formValues = {}) {
	const fields = [];

	let scripts = {};
	formValues = {
		...formValues,
		'@created_time': union([ NULL, NUMBER ]),
		'@edited_time': union([ NULL, NUMBER ])
	};
	const getFormValue = key => {
		return formValues[key.normalize('NFC')];
	};

	const validateDefinition = function (id, definitions = scripts) {
		const analysis = analyze(definitions, id, getFormValue);
		if (!analysis.valid) {
			const err = new Error(JSON.stringify(analysis));
			err.statusCode = 400;
			throw err;
		}
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
			const err = new Error(`The AKSO Script expression in #${prop} in the form entry at pos ${i} caused a generic error (might be a stack overflow)`);
			err.statusCode = 400;
			throw err;
		}
		if (!analysis.valid) {
			const err = new Error(`The AKSO Script expression in #${prop} in the form entry at pos ${i} errored with ${JSON.stringify(analysis.error)}`);
			err.statusCode = 400;
			throw err;
		}
	};

	const aksoCountries = (await AKSO.db('countries').select('code'))
		.map(x => x.code);

	const inputNameRegex = /^[\w\-:ĥŝĝĉĵŭ]+$/i;
	for (const [i, formEntry] of Object.entries(form)) {
		if (formEntry.el === 'input') {
			formEntry.name = formEntry.name.normalize('NFC');
			if (!inputNameRegex.test(formEntry.name)) {
				const err = new Error('Invalid FormEntryInput#name');
				err.statusCode = 400;
				throw err;
			}
			if (fields.includes(formEntry.name)) {
				const err = new Error('Duplicate FormEntryInput with name ' + formEntry.name);
				err.statusCode = 400;
				throw err;
			}
			fields.push(formEntry.name);

			// Form values
			if (formEntry.type === 'boolean') {
				formValues[formEntry.name] = BOOL;
			} else if (['number', 'money', 'datetime'].includes(formEntry.type)) {
				formValues[formEntry.name] = union([ NULL, NUMBER ]);
			} else if (['text', 'enum', 'country', 'date', 'time'].includes(formEntry.type)) {
				formValues[formEntry.name] = union([ NULL, STRING ]);
			} else if (formEntry.type === 'boolean_table') {
				formValues[formEntry.name] = ascArray(union([ NULL, BOOL ]));
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
				if (typeof formEntry.default === 'string') {
					if (formEntry.variant === 'textarea') {
						if (formEntry.default.length > 8192) {
							const err = new Error('default exceeds 8192 chars in formEntry' + formEntry.name);
							err.statusCode = 400;
							throw err;
						}
						if (formEntry.default.includes('\n')) {
							const err = new Error('default must not contain newlines in formEntry ' + formEntry.name);
							err.statusCode = 400;
							throw err;
						}
					} else {
						if (formEntry.default.length > 2048) {
							const err = new Error('default exceeds 2048 chars in formEntry' + formEntry.name);
							err.statusCode = 400;
							throw err;
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
				for (const opt of formEntry.options) {
					if (!('disabled' in opt)) { opt.disabled = false; }
				}

				if (typeof formEntry.default === 'string') {
					const optValues = formEntry.options.map(x => x.value);
					if (!optValues.includes(formEntry.default)) {
						const err = new Error('Invalid default in formEntry ' + formEntry.name);
						err.statusCode = 400;
						throw err;
					}
				}
			} else if (formEntry.type === 'country') {
				if (!('add' in formEntry)) { formEntry.add = []; }
				if (!('exclude' in formEntry)) { formEntry.exclude = []; }
				if (!('chAutofill' in formEntry)) { formEntry.chAutofill = null; }

				if (formEntry.add.length !== [...new Set(formEntry.add)].length) {
					const err = new Error('Duplicate entries in add in formEntry ' + formEntry.name);
					err.statusCode = 400;
					throw err;
				}
				
				if (formEntry.exclude.length !== [...new Set(formEntry.exclude)].length) {
					const err = new Error('Duplicate entries in exclude in formEntry ' + formEntry.name);
					err.statusCode = 400;
					throw err;
				}

				if (typeof formEntry.default === 'string') {
					const validValues = aksoCountries
						.concat(formEntry.add)
						.filter(x => !formEntry.exclude.includes(x));
					if (!validValues.includes(formEntry.default)) {
						const err = new Error('Invalid default in formEntry ' + formEntry.name);
						err.statusCode = 400;
						throw err;
					}
				}
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
					const err = new Error(`headerTop in formEntry ${formEntry.name} must have as many items as it has columns`);
					err.statusCode = 400;
					throw err;
				}
				if (formEntry.headerLeft && formEntry.headerLeft.length !== formEntry.cols) {
					const err = new Error(`headerLeft in formEntry ${formEntry.name} must have as many items as it has columns`);
					err.statusCode = 400;
					throw err;
				}
			}
		} else if (formEntry.el === 'script') {
			scripts = { ...scripts, ...formEntry.script };
			let analyses;
			try {
				analyses = analyzeAll(scripts, getFormValue);
			} catch (e) {
				const err = new Error(`The AKSO Script at pos ${i} caused a generic error (might be a stack overflow)`);
				err.statusCode = 400;
				throw err;
			}
			for (const [def, analysis] of Object.entries(analyses)) {
				if (!analysis.valid) {
					const err = new Error(`The definition for ${def} in the AKSO Script at pos ${i} errored with ${JSON.stringify(analysis.error)}`);
					err.statusCode = 400;
					throw err;
				}
			}
		}
	}

	return {
		validateDefinition,
		scripts
	};
}
