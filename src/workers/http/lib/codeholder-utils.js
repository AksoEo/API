import * as Canvas from 'canvas';
import fs from 'fs-extra';
import path from 'path';
import moment from 'moment-timezone';
import crypto from 'pn/crypto';

import { profilePictureSizes } from '../routing/codeholders/schema';
import { cropImgToSizes } from './canvas-utils';

/**
 * The JSON schema used for validating codeholder mod query params
 * @type {Object}
 */
export const modQuerySchema = {
	type: 'object',
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

	// Hash the picture
	const hash = crypto.createHash('sha1').update(img.src).digest();

	// Crop and scale the picture to all the necessary sizes
	const pictures = cropImgToSizes(img, mimetype, profilePictureSizes, true);

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
		.update({ profilePictureHash: hash });

	// Update datum history
	await AKSO.db('codeholders_hist_profilePictureHash')
		.insert({
			codeholderId: codeholderId,
			modTime: moment().unix(),
			modBy: modBy,
			modCmt: modCmt,
			profilePictureHash: hash
		});
}
