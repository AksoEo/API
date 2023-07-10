import { analyzeAll } from '@tejo/akso-script';

import AKSOOrganization from 'akso/lib/enums/akso-organization';
import AKSONotifTemplateIntent from 'akso/lib/enums/akso-notif-template-intent';

const schema = {
	query: null,
	body: {
		type: 'object',
		properties: {
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
				pattern: '^[^\\n]+$',
				nullable: true
			},
			replyTo: {
				type: 'string',
				format: 'email',
				minLength: 1,
				maxLength: 255,
				nullable: true
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
										maxLength: 20000
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
		minProperties: 1,
		additionalProperties: false
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const templateData = await AKSO.db('notif_templates')
			.where('id', req.params.notifTemplateId)
			.first('org', 'base', 'intent');
		if (!templateData) { return res.sendStatus(404); }
		if (!req.hasPermission('notif_templates.update.' + templateData.org)) { return res.sendStatus(403); }

		// Manual data validation
		// Verify base
		if (templateData.base === 'raw') {
			if ('modules' in req.body) {
				return res.status(400).type('text/plain')
					.send('modules is only allowed for base=inherit');
			}
		} else if (templateData.base === 'inherit') {
			if ('html' in req.body || 'text' in req.body) {
				return res.status(400).type('text/plain')
					.send('html and text are only allowed for base=raw');
			}
		}

		// Verify script
		if (req.body.script) {
			let analyses;
			try {
				analyses = analyzeAll(req.body.script, AKSONotifTemplateIntent.getFormValues(templateData.intent));
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
		if (req.body.from) {
			const fromDomain = req.body.from.substring(1 + req.body.from.lastIndexOf('@'));
			if (!AKSOOrganization.getEmailDomains(templateData.org).includes(fromDomain)){
				return res.status(403).type('text/plain')
					.send(`Illegal from address domain ${fromDomain}`);
			}
		}

		const data = { ...req.body };
		if (data.script) { data.script = JSON.stringify(data.script); }
		if (data.modules) { data.modules = JSON.stringify(data.modules); }

		await AKSO.db('notif_templates')
			.where('id', req.params.notifTemplateId)
			.update(data);

		res.sendStatus(204);
	}
};
