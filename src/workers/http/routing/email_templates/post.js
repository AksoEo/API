import path from 'path';
import { analyzeAll } from '@tejo/akso-script';

import AKSOOrganization from 'akso/lib/enums/akso-organization';
import AKSOEmailTemplateIntent from 'akso/lib/enums/akso-email-template-intent';

import { domains } from './schema';

const genericRequiredProps = [
	'base', 'org', 'name', 'intent', 'subject', 'from'
];

const schema = {
	query: null,
	body: {
		definitions: {
			EmailTemplate: {
				type: 'object',
				properties: {
					base: {
						type: 'string'
					},
					org: {
						type: 'string',
						enum: AKSOOrganization.allLower.filter(x => x !== 'akso')
					},
					name: {
						type: 'string',
						minLength: 1,
						maxLength: 150,
						pattern: '^[^\\n]+$'
					},
					description: {
						type: 'string',
						minLength: 1,
						maxLength: 2000,
						nullable: true
					},
					intent: {
						type: 'string',
						enum: AKSOEmailTemplateIntent.allLower
					},
					script: {
						type: 'object',
						nullable: true
					},
					subject: {
						type: 'string',
						minLength: 1,
						maxLength: 255,
						pattern: '^[^\\n]+$'
					},
					from: {
						type: 'string',
						format: 'email',
						minLength: 1,
						maxLength: 255
					},
					fromName: {
						type: 'string',
						minLength: 1,
						maxLength: 50,
						pattern: '^[^\\n]+$'
					},
					replyTo: {
						type: 'string',
						format: 'email',
						minLength: 1,
						maxLength: 255,
						nullable: true
					}
				}
			}
		},

		oneOf: [
			{ // EmailTemplateRaw
				$merge: {
					source: { $ref: '#/definitions/EmailTemplate' },
					with: {
						type: 'object',
						properties: {
							base: {
								const: 'raw'
							},
							html: {
								type: 'string',
								minLength: 1,
								maxLength: 100000
							},
							text: {
								type: 'string',
								minLength: 1,
								maxLength: 10000
							}
						},
						required: genericRequiredProps.concat([ 'html', 'text' ]),
						additionalProperties: false
					}
				}
			},
			{ // EmailTemplateInherit
				$merge: {
					source: { $ref: '#/definitions/EmailTemplate' },
					with: {
						type: 'object',
						properties: {
							base: {
								const: 'inherit'
							},
							modules: {
								type: 'array',
								minItems: 1,
								maxItems: 16,
								items: {
									oneOf: [
										{
											type: 'object',
											properties: {
												type: {
													type: 'string',
													const: 'image'
												},
												url: {
													type: 'string',
													maxLength: 200
												},
												alt: {
													type: 'string',
													minLength: 1,
													maxLength: 200,
													pattern: '^[^\\n]+$',
													nullable: true
												}
											},
											required: [ 'type', 'url' ],
											additionalProperties: false
										},
										{
											type: 'object',
											properties: {
												type: {
													type: 'string',
													const: 'text'
												},
												columns: {
													type: 'array',
													minItems: 1,
													maxItems: 2,
													nullable: true,
													items: {
														type: 'string',
														minLength: 1,
														maxLength: 5000
													}
												},
												button: {
													type: 'object',
													nullable: true,
													additionalProperties: false,
													required: [ 'href', 'text' ],
													properties: {
														href: {
															type: 'string',
															maxLength: 200,
															pattern: '^[^\n]+$'
														},
														text: {
															type: 'string',
															minLength: 1,
															maxLength: 200,
															pattern: '^[^\\n]+$'
														}
													}
												}
											},
											required: [ 'type' ],
											additionalProperties: false
										}
									]
								}
							}
						},
						required: genericRequiredProps.concat([ 'modules' ]),
						additionalProperties: false
					}
				}
			}
		]
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const orgPerm = 'email_templates.create.' + req.body.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		// Manual data validation
		// Verify script
		if (req.body.script) {
			let analyses;
			try {
				analyses = analyzeAll(req.body.script, AKSOEmailTemplateIntent.getFormValues(req.body.intent));
			} catch {
				return res.status(400).type('text/plain')
					.send('The AKSO Script in script caused a generic error (might be a stack overflow)');
			}
			for (const [def, analysis] of Object.entries(analyses)) {
				if (!analysis.valid) {
					return res.status(400).type('text/plain')
						.send(`The definition for ${def} in the AKSO Script in script errored with ${JSON.stringify(analysis.error)}`);
				}
			}
		}

		// Verify from
		const fromDomain = req.body.from.substring(1 + req.body.from.lastIndexOf('@'));
		if (!domains[req.body.org].includes(fromDomain)){
			return res.status(403).type('text/plain')
				.send(`Illegal from address domain ${fromDomain}`);
		}

		const data = { ...req.body };
		if (data.script) { data.script = JSON.stringify(data.script); }
		if (data.modules) { data.modules = JSON.stringify(data.modules); }

		const id = (await AKSO.db('email_templates').insert(data))[0];

		res.set('Location', path.join(AKSO.conf.http.path, 'email_templates', id.toString()));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
