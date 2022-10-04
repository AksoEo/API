import fs from 'fs-extra';
import path from 'path';
import moment from 'moment-timezone';
import crypto from 'pn/crypto';

import { profilePictureSizes } from '../routing/codeholders/schema';
import { cropImgToSizes } from './canvas-util';

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
	// Try to process the picture
	let pictures;
	try {
		// Crop and scale the picture to all the necessary sizes
		pictures = await cropImgToSizes(tmpFile, profilePictureSizes, true, true);
	} catch (e) {
		const err = new Error('Unable to load picture');
		err.statusCode = 400;
		throw err;
	}

	// Hash the picture
	const hash = crypto.createHash('sha1').update(pictures.org).digest();
	delete pictures.org;

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
	const oldData = await AKSO.db('codeholders')
		.where('id', codeholderId)
		.first('profilePictureHash');

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
			profilePictureHash: oldData.profilePictureHash || null
		});
}

export function formatCodeholderName ({
	codeholderType,
	firstName,
	firstNameLegal,
	lastName,
	lastNameLegal,
	fullName,
	honorific
} = {}) {
	let name = '';
	if (codeholderType === 'human') {
		if (honorific) { name += honorific + ' '; }
		name = firstName || firstNameLegal;
		if (lastName || lastNameLegal) {
			name += ' ' + (lastName || lastNameLegal);
		}

	} else if (codeholderType === 'org') {
		name = fullName;
	}
	return name;
}

/**
 * Returns whether a codeholder is an active member at a given time
 * @param  {number|string} codeholderId The id of the codeholder
 * @param  {any}           [time]       A time identifier understood by moment.js, defaults to now
 * @return {boolean}
 */
export async function isActiveMember (codeholderId, time = moment()) {
	const result = await AKSO.db('membershipCategories_codeholders')
		.first(1)
		.leftJoin('membershipCategories', 'membershipCategories_codeholders.categoryId', 'membershipCategories.id')
		.whereRaw(`
			membershipCategories_codeholders.codeholderId = :codeholderId
			AND givesMembership
			AND (
				( NOT lifetime AND membershipCategories_codeholders.year = :year )
				OR ( lifetime AND membershipCategories_codeholders.year <= :year )
			)
		`, {
			codeholderId,
			year: moment(time).year()
		});
	return !!result;
}
