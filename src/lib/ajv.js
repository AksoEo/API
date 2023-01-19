import Ajv from 'ajv';
import AjvMergePatch from 'ajv-merge-patch';
import AjvFormats from 'ajv-formats';
import moment from 'moment-timezone';

const ajv = new Ajv({
	useDefaults: true,
	strictTypes: true,
	strictTuples: false, // disabled as the warnings are currently broken, see https://github.com/ajv-validator/ajv/issues/1417
	discriminator: true,
	logger: AKSO.log,
});
AjvFormats(ajv);
AjvMergePatch(ajv);

ajv.addKeyword({
	keyword: 'isBinary',
	modifying: true,
	validate: function (schema, data, parentSchema, dataPath) {
		if (!schema) { return true; }

		if (typeof data === 'string') {
			dataPath.parentData[dataPath.parentDataProperty] = Buffer.from(data, 'base64');
			return true;

		} else if (data instanceof Buffer) {
			return true;
		}

		return false;
	}
});
ajv.addKeyword({
	keyword: 'minBytes',
	validate: function (schema, data) {
		const buf = Buffer.from(data);
		return buf.length >= schema;
	}
});
ajv.addKeyword({
	keyword: 'maxBytes',
	validate: function (schema, data) {
		const buf = Buffer.from(data);
		return buf.length <= schema;
	}
});
ajv.addKeyword({
	keyword: 'validateFunction',
	validate: function (schema, data) {
		return !!schema(data);
	}
});

ajv.addFormat('year', {
	type: 'number',
	validate: function (val) {
		return val >= 1901 && val <= 2155; // https://dev.mysql.com/doc/refman/5.7/en/year.html
	}
});
ajv.addFormat('string-year', {
	type: 'string',
	validate: function (val) {
		if (!/^\d{4}$/.test(val)) { return false; }
		val = parseInt(val, 10);
		return val >= 1901 && val <= 2155;
	}
});
ajv.addFormat('short-time', {
	type: 'string',
	validate: function (val) {
		if (!/^\d{1,2}:\d{2}$/.test(val)) { return false; }
		const bits = val.split(':').map(x => parseInt(x, 10));
		if (bits[0] > 23) { return false; }
		if (bits[1] > 59) { return false; }
		return true;
	},
	compare: function (a, b) {
		const times = [ a, b ].map(time => {
			const arr = time
				.split(':')
				.map(x => parseInt(x, 10));
			return arr[0] * 60 + arr[1];
		});
		if (times[0] > times[1]) { return 1; }
		else if (times[0] < times[1]) { return -1; }
		else { return 0; }
	}
});
ajv.addFormat('tel', {
	type: 'string',
	validate: /^\+[a-z0-9]{1,49}$/i
});
ajv.addFormat('tz', {
	type: 'string',
	validate: val => moment.tz.names().includes(val)
});
ajv.addFormat('safe-uri', {
	type: 'string',
	validate: function (val) {
		if (!urlRegex.test(val)) { return false; }
		let parsedURL;
		try { parsedURL = new URL(val); }
		catch (e) { return false; }
		if (parsedURL.username) { return false; }
		if (parsedURL.password) { return false; }
		if (parsedURL.protocol !== 'http:' && parsedURL.protocol !== 'https:') { return false; }
		return true;
	}
});
ajv.addFormat('int8', {
	type: 'number',
	validate: function (val) {
		return Number.isSafeInteger(val) && val >= -(2**7) && val < 2**7;
	}
});
ajv.addFormat('uint8', {
	type: 'number',
	validate: function (val) {
		return Number.isSafeInteger(val) && val >= 0 && val < 2**8;
	}
});
ajv.addFormat('int16', {
	type: 'number',
	validate: function (val) {
		return Number.isSafeInteger(val) && val >= -(2**15) && val < 2**15;
	}
});
ajv.addFormat('uint16', {
	type: 'number',
	validate: function (val) {
		return Number.isSafeInteger(val) && val >= 0 && val < 2**16;
	}
});
ajv.addFormat('int32', {
	type: 'number',
	validate: function (val) {
		return Number.isSafeInteger(val) && val >= -(2**31) && val < 2**31;
	}
});
ajv.addFormat('uint32', {
	type: 'number',
	validate: function (val) {
		return Number.isSafeInteger(val) && val >= 0 && val < 2**32;
	}
});
ajv.addFormat('int64', {
	type: 'number',
	validate: function (val) {
		return Number.isSafeInteger(val) && val >= -(2**63) && val < 2**63;
	}
});
ajv.addFormat('uint64', {
	type: 'number',
	validate: function (val) {
		return Number.isSafeInteger(val) && val >= 0 && val < 2**64;
	}
});
export { ajv };

// From: https://gist.github.com/dperini/729294
//
// Regular Expression for URL validation
//
// Author: Diego Perini
// Created: 2010/12/05
// Updated: 2018/09/12
// License: MIT
//
// Copyright (c) 2010-2018 Diego Perini (http://www.iport.it)
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.
export const urlRegex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
