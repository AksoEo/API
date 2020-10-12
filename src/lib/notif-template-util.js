import path from 'path';
import fs from 'fs-extra';
import MarkdownIt from 'markdown-it';

import { doAscMagic, evaluateSync } from 'akso/lib/akso-script-util';
import { escapeHTML, promiseAllObject, renderTemplate as renderNativeTemplate } from 'akso/util';

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

	const viewFn = key => {
		if (key[0] === '@') {
			return intentData[key.substring(1)];
		} else {
			try {
				return evaluateSync(template.script, key, intentData);
			} catch { return undefined; } // this should never happen
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
		unsubscribe: false
	};

	return {
		html: renderNativeTemplate(tmpls.outerHtml, {...outerView, ...{ content: innerHtml } }),
		text: renderNativeTemplate(tmpls.outerText, {...outerView, ...{ content: innerText } }, false)
	};
}

const ifRegex = /\{\{#if\s+(.+?)}}(.+?)(?:\{\{#else}}(.+?))?\{\{\/if}}/gs;
const identifierRegex = /\{\{([^#/].*?)}}/gs;

const inheritTextMd = new MarkdownIt('zero');
inheritTextMd.enable([
	'newline',
	
	'blockquote', 'heading', 'emphasis',
	'strikethrough', 'link', 'list',
	'table', 'image'
]);
function renderInheritModule (type, module, viewFn) {
	const view = { ...module };
	if (view.type === 'image') {
		view.href = renderTemplateStr('text', view.url, viewFn);
		view.alt = renderTemplateStr('text', view.alt, viewFn);
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
		let value = viewFn(identifier);
		if (typeof value === 'undefined') { return match; }
		else {
			if (type === 'html') { return escapeHTML(value); }
			else if (type === 'text') { return value; }
		}
	});

	return str;
}
