import path from 'path';
import fs from 'fs-extra';
import MarkdownIt from 'markdown-it';
import { evaluate } from '@tejo/akso-script';

import { escapeHTML, promiseAllObject, renderTemplate as renderNativeTemplate } from 'akso/util';

export async function renderTemplate (templateId, intentData) {
	const templateData = await AKSO.db('email_templates')
		.where('id', templateId)
		.first('*');

	let view = {};
	for (const [formKey, formVal] of Object.entries(intentData)) {
		view['@' + formKey] = formVal;
	}

	const viewFn = key => {
		if (key[0] === '@') {
			return intentData[key.substring(1)];
		} else {
			try {
				return evaluate(templateData.script, key, intentData);
			} catch { return undefined; } // this should never happen
		}
	};

	if (templateData.base === 'raw') {
		return renderRawTemplate(templateData, viewFn);
	} else if (templateData.base === 'inherit') {
		return await renderInheritTemplate(templateData, viewFn);
	}
}

async function renderRawTemplate (templateData, viewFn) {
	return {
		html: renderTemplateStr('html', templateData.html, viewFn),
		text: renderTemplateStr('text', templateData.text, viewFn)
	};
}

async function renderInheritTemplate (templateData, viewFn) {
	const notifsDir = path.join(AKSO.dir, 'notifs');
	const tmplsDir = path.join(notifsDir, 'email-templates');
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
	'blockquote', 'heading', 'emphasis',
	'strikethrough', 'link', 'list',
	'table', 'image'
]);
function renderInheritModule (type, module, viewFn) {
	const view = { ...module };
	if (view.type === 'image') {
		view.url = renderTemplateStr('text', view.url, viewFn);
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
