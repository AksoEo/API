import * as Canvas from 'canvas';
import fs from 'fs-extra';
import path from 'path';
import moment from 'moment-timezone';

import { profilePictureSizes } from '../routing/codeholders/schema';

/**
 * Obtains the names and emails of codeholders by their ids
 * @param  {...number} ids The internal ids of the codeholders to look up
 * @return {Object[]} The names and emails of the codeholders in the same order as they were provided
 */
export async function getNamesAndEmails (...ids) {
	const map = {};
	ids.forEach((id, i) => {
		map[id] = i;
	});
	const codeholders = await AKSO.db('view_codeholders')
		.whereIn('id', ids)
		.whereNotNull('email')
		.select('id', 'codeholderType', 'honorific', 'firstName', 'firstNameLegal', 'lastName', 'lastNameLegal', 'fullName', 'email');

	const newArr = [];
	for (let codeholder of codeholders) {
		const index = map[codeholder.id];
		let name;
		if (codeholder.codeholderType === 'human') {
			if (codeholder.honorific) { name += codeholder.honorific + ' '; }
			name = codeholder.firstName || codeholder.firstNameLegal;
			name += ' ' + (codeholder.lastName || codeholder.lastNameLegal);

		} else if (codeholder.codeholderType === 'org') {
			name = codeholder.fullName;
		}
		newArr[index] = {
			email: codeholder.email,
			name: name
		};
	}
	return newArr;
}

/**
 * The JSON schema used for validating codeholder mod query params
 * @type {Object}
 */
export const modQuerySchema = {
	properties: {
		modCmt: {
			type: 'string',
			minLength: 1,
			maxLength: 500
		}
	},
	additionalProperties: false
};

export async function setProfilePicture (codeholderId, tmpFile, mimetype, modBy, modCmt) {
	// Try to load the picture
	let img;
	try {
		img = await Canvas.loadImage(tmpFile);
	} catch (e) {
		const err = new Error('Unable to load picture');
		err.statusCode = 400;
		throw err;
	}

	// Crop and scale the picture to all the necessary sizes
	const pictures = {};
	for (let size of profilePictureSizes) {
		const canvas = Canvas.createCanvas(size, size);
		const ctx = canvas.getContext('2d');
		const hRatio = canvas.width / img.width;
		const vRatio = canvas.height / img.height;
		const ratio = Math.max(hRatio, vRatio);
		const centerShiftX = (canvas.width - img.width * ratio) / 2;
		const centerShiftY = (canvas.height - img.height * ratio) / 2;
		ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
		pictures[size] = canvas.toBuffer(mimetype);
	}

	// Ensure the dir for the codeholder's profile picture exists
	const picDir = path.join(AKSO.conf.dataDir, 'codeholder_pictures', codeholderId.toString());
	await fs.ensureDir(picDir);

	// Write all files
	const writePromises = [
		// Write the info file
		fs.writeFile(path.join(picDir, 'pic.txt'), JSON.stringify({
			mime: mimetype
		}))
	];

	// Write the pictures
	for (let [size, picture] of Object.entries(pictures)) {
		writePromises.push(
			fs.writeFile(path.join(picDir, size), picture)
		);
	}

	// Wait for the writes to finish
	await Promise.all(writePromises);

	// Update the db
	await AKSO.db('codeholders')
		.where('id', codeholderId)
		.update({ hasProfilePicture: true });

	// Update datum history
	await AKSO.db('codeholders_hist_profilePicture')
		.insert({
			codeholderId: codeholderId,
			modTime: moment().unix(),
			modBy: modBy,
			modCmt: modCmt,
			hasProfilePicture: true
		});

	// Remove the temp file
	await fs.unlink(tmpFile);
}
