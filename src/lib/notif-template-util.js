import * as AddressFormat from '@cpsdqs/google-i18n-address';
import path from 'path';
import fs from 'fs-extra';
import MarkdownIt from 'markdown-it';
import MarkdownItMultimdTable from 'markdown-it-multimd-table';

import QueryUtil from 'akso/lib/query-util';
import AKSOOrganization from 'akso/lib/enums/akso-organization';
import { sendRawMail } from 'akso/mail';
import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';
import CodeholderResource from 'akso/lib/resources/codeholder-resource';
import { formatCodeholderName } from 'akso/workers/http/lib/codeholder-util';
import { doAscMagic, evaluateSync } from 'akso/lib/akso-script-util';
import { escapeHTML, promiseAllObject, renderTemplate as renderNativeTemplate, getSafeHandlebarsString } from 'akso/util';

/**
 * Renders a notif template and sends it to the recipients
 * @param  {number}  templateId           The id of the notif template
 * @param  {Object}  [intentData]         An object containing the context data relevant for the template's intent. Codeholder data is automatically added.
 * @param  {Object}  [req]                Data to pass to QueryUtil.simpleCollection, e.g. filter
 * @param  {Object}  [fieldWhitelist]     A field whitelist to pass to QueryUtil.simpleCollection
 * @param  {boolean} [ignoreMemberFilter] Whether to ignore the member filter if present in req
 * @param  {Function}[queryModifier]      A sync function to modify the raw knex codeholder query
 */
export async function sendTemplate ({
	templateId, intentData = {}, req = {}, fieldWhitelist = [],
	ignoreMemberFilter = false, queryModifier,
}) {
	const template = await AKSO.db('notif_templates')
		.where('id', templateId)
		.first('*');
	if (!template) { throw new Error('Could not fetch notif template with id ' + templateId); }

	const recipientsQuery = AKSO.db('view_codeholders')
		.whereNotNull('email') // TODO: Remove when adding proper Telegram notif support
		.where('isDead', false);
	if (queryModifier) {
		queryModifier(recipientsQuery);
	}

	if (!ignoreMemberFilter) {
		memberFilter(codeholderSchema, recipientsQuery, req);
	}

	const customReq = {
		query: {
			filter: {},
		},
		...req
	};
	customReq.query.fields = [
		'id',
		'firstName',
		'firstNameLegal',
		'lastName',
		'lastNameLegal',
		'fullName',
		'honorific',
		'oldCode',
		'newCode',
		'codeholderType',
		'hasPassword',

		'address.country',
		'address.countryArea',
		'address.city',
		'address.cityArea',
		'address.streetAddress',
		'address.postalCode',
		'address.sortingCode',

		'addressLatin.country',
		'addressLatin.countryArea',
		'addressLatin.city',
		'addressLatin.cityArea',
		'addressLatin.streetAddress',
		'addressLatin.postalCode',
		'addressLatin.sortingCode',

		'feeCountry',
		'email',
		'birthdate',
		'cellphone',
		'officePhone',
		'landlinePhone',
		'age',
		'agePrimo'
	];
	QueryUtil.simpleCollection(customReq, codeholderSchema, recipientsQuery, fieldWhitelist);

	const countryNames = [];
	(await AKSO.db('countries')
		.select('code', 'name_eo')
	).forEach(x => {
		countryNames[x.code] = x.name_eo;
	});

	const sendPromises = [];

	const recipientsStream = recipientsQuery.stream();
	const donePromise = new Promise((resolve, reject) => {
		recipientsStream.on('end', () => resolve());
		recipientsStream.on('error', reject);
	});

	for await (const row of recipientsStream) {
		const codeholder = new CodeholderResource(row, customReq, codeholderSchema).obj;
		const addressObj = {
			countryCode: 	codeholder.address.country,
			countryArea: 	codeholder.address.countryArea,
			city: 			codeholder.address.city,
			cityArea: 		codeholder.address.cityArea,
			streetAddress: 	codeholder.address.streetAddress,
			postalCode: 	codeholder.address.postalCode,
			sortingCode: 	codeholder.address.sortingCode,
			name: ''
		};
		const address = await AddressFormat.formatAddress(
			addressObj,
			false,
			'eo',
			countryNames[addressObj.countryCode]
		);

		const notifView = {
			'codeholder.id': codeholder.id,
			'codeholder.name': formatCodeholderName(codeholder),
			'codeholder.oldCode': codeholder.oldCode,
			'codeholder.newCode': codeholder.newCode,
			'codeholder.codeholderType': codeholder.codeholderType,
			'codeholder.hasPassword': codeholder.hasPassword,
			'codeholder.addressFormatted': address,
			'codeholder.addressLatin.country': codeholder.addressLatin.country,
			'codeholder.addressLatin.countryArea': codeholder.addressLatin.countryArea,
			'codeholder.addressLatin.city': codeholder.addressLatin.city,
			'codeholder.addressLatin.cityArea': codeholder.addressLatin.cityArea,
			'codeholder.addressLatin.streetAddress': codeholder.addressLatin.streetAddress,
			'codeholder.addressLatin.postalCode': codeholder.addressLatin.postalCode,
			'codeholder.addressLatin.sortingCode': codeholder.addressLatin.sortingCode,
			'codeholder.feeCountry': codeholder.feeCountry,
			'codeholder.email': codeholder.email,
			'codeholder.birthdate': codeholder.birthdate ?? null,
			'codeholder.cellphone': codeholder.cellphone ?? null,
			'codeholder.officePhone': codeholder.officePhone,
			'codeholder.landlinePhone': codeholder.landlinePhone ?? null,
			'codeholder.age': codeholder.age ?? null,
			'codeholder.agePrimo': codeholder.agePrimo ?? null,
			...intentData,
		};

		sendPromises.push(new Promise((resolve, reject) => {
			renderTemplate(template, notifView)
				.then(renderedEmail => {
					const msg = {
						...renderedEmail,
						to: {
							name: notifView['codeholder.name'],
							email: codeholder.email
						},
						from: {
							name: template.fromName || '',
							email: template.from
						}
					};
					// TODO: Change this when we support Telegram for notif templates
					return sendRawMail(msg);
				})
				.then(resolve)
				.catch(reject);
		}));
	}

	await donePromise;
	await Promise.all(sendPromises);
}

/**
 * Renders a notif template
 * @param  {number|string|Object} template  The id of the template or an object containing all its data
 * @param  {Object} intentData              An object containing the context data relevant for the template's intent
 * @return {Object} Returns an object containing rendered html, text and subject.
 */
export async function renderTemplate (template, intentData) {
	await doAscMagic();

	if (typeof template !== 'object') {
		template = await AKSO.db('notif_templates')
			.where('id', template)
			.first('*');
		if (!template) { throw new Error('Could not fetch notif template with id ' + template); }
	}

	const getIntentDataKey = (key, forRender = false) => {
		const intentVal = intentData[key];
		if (typeof intentVal === 'object' && intentVal._akso_safeHtml) {
			if (forRender) { return getSafeHandlebarsString(intentVal.val); }
			return intentVal.val;
		}
		return intentVal;
	};

	const viewFn = key => {
		if (key[0] === '@') {
			return getIntentDataKey(key.substring(1), true);
		} else {
			try {
				return evaluateSync(template.script, key, formKey => getIntentDataKey(formKey, false));
			} catch (e) { return undefined; } // this should never happen
		}
	};

	let data = {};
	if (template.base === 'raw') {
		data = await renderRawTemplate(template, viewFn);
	} else if (template.base === 'inherit') {
		data = await renderInheritTemplate(template, viewFn);
	}
	data.subject = renderTemplateStr('text', template.subject, viewFn);
	return data;
}

async function renderRawTemplate (templateData, viewFn) {
	return {
		html: renderTemplateStr('html', templateData.html, viewFn),
		text: renderTemplateStr('text', templateData.text, viewFn)
	};
}

async function renderInheritTemplate (templateData, viewFn) {
	const notifsDir = path.join(AKSO.dir, 'notifs');
	const tmplsDir = path.join(notifsDir, 'notif-templates');
	const orgDir = path.join(notifsDir, templateData.org);
	const globalDir = path.join(orgDir, '_global', 'email');

	const tmpls = await promiseAllObject({
		outerHtml: fs.readFile(path.join(globalDir, 'notif.html'), 'utf8'),
		outerText: fs.readFile(path.join(globalDir, 'notif.txt'), 'utf8'),

		imageHtml: fs.readFile(path.join(tmplsDir, 'image.html'), 'utf8'),
		imageText: fs.readFile(path.join(tmplsDir, 'image.txt'), 'utf8'),
		textHtml: fs.readFile(path.join(tmplsDir, 'text.html'), 'utf8'),
		textText: fs.readFile(path.join(tmplsDir, 'text.txt'), 'utf8')
	});

	// Render and merge inners
	const innerHtml = templateData.modules
		.map(module => {
			const view = renderInheritModule('html', module, viewFn);
			return renderNativeTemplate(tmpls[module.type + 'Html'], view);
		})
		.join('');
	const innerText = templateData.modules
		.map(module => {
			const view = renderInheritModule('text', module, viewFn);
			return renderNativeTemplate(tmpls[module.type + 'Text'], view, false);
		})
		.join('\n\n');

	const outerView = {
		subject: templateData.subject,
		domain: AKSOOrganization.getDomain(templateData.org),
	};

	const outerViewHtml = {
		content: innerHtml,
		...outerView,
	};
	const outerViewText = {
		content: innerText,
		...outerView,
	};
	return {
		html: renderNativeTemplate(tmpls.outerHtml, outerViewHtml),
		text: renderNativeTemplate(tmpls.outerText, outerViewText, false)
	};
}

const ifRegex = /\{\{#if\s+(.+?)}}(.+?)(?:\{\{#else}}(.+?))?\{\{\/if}}/gs;
const identifierRegex = /\{\{([^#/].*?)}}/gs;

const inheritTextMd = new MarkdownIt('zero', {
	breaks: true,
}).use(MarkdownItMultimdTable, {
	multiline: true,
	rowspan: true,
	headerless: true,
});
inheritTextMd.enable([
	'newline',
	
	'blockquote', 'heading', 'emphasis',
	'strikethrough', 'link', 'list',
	'table', 'image'
]);
export { inheritTextMd };
function renderInheritModule (type, module, viewFn) {
	const view = { ...module };
	if (view.type === 'image') {
		view.href = renderTemplateStr('text', view.url, viewFn);
		if (view.alt){
			view.alt = renderTemplateStr('text', view.alt, viewFn);
		}
	} else if (view.type === 'text') {
		if (view.columns) {
			view.columns = view.columns.map(str => {
				str = renderTemplateStr('text', str, viewFn);
				if (type === 'html') { str = inheritTextMd.render(str); }
				return str;
			});
		}
		if (view.button) {
			view.button.href = renderTemplateStr('text', view.button.href, viewFn);
			view.button.text = renderTemplateStr('text', view.button.text, viewFn);
		}
	}
	return view;
}

function renderTemplateStr (type, str, viewFn) {
	// #if
	let didReplace = true;
	while (didReplace) {
		didReplace = false;
		str = str.replace(ifRegex, (match, argIf, argThen, argElse) => {
			didReplace = true;
			const ifVal = viewFn(argIf);
			if (ifVal) { return argThen; }
			else { return argElse || ''; }
		});
	}

	// {{identifiers}}
	str = str.replace(identifierRegex, (match, identifier) => {
		const value = viewFn(identifier);
		if (typeof value === 'undefined') { return match; }
		else {
			if (type === 'html') {
				if (typeof value.toHTML === 'function') {
					return value.toHTML();
				}
				return escapeHTML(value);
			}
			else if (type === 'text') { return value; }
		}
	});

	return str;
}
