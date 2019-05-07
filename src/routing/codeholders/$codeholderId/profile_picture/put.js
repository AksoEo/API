import fs from 'fs-extra';
import path from 'path';
import moment from 'moment';
import * as Canvas from 'canvas';

import { schema as parSchema, memberFilter, memberFieldsManual, profilePictureSizes } from '../../schema';
import { modQuerySchema } from '../../../../lib/codeholder-utils';

const mimeTypes = [
	'image/jpeg',
	'image/png'
];

export default {
	schema: {
		query: modQuerySchema,
		body: null,
		multipart: [
			{
				name: 'picture',
				maxCount: 1,
				minCount: 1,
				maxSize: '2mb',
				mimeCheck: mime => mimeTypes.includes(mime)
			}
		],
		requirePerms: 'codeholders.update'
	},

	run: async function run (req, res) {
		const file = req.files.picture[0];

		// Check member fields
		const requiredMemberFields = [
			'id',
			'profilePicture'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'r')) {
			await cleanUp(file);
			return res.status(403).type('text/plain').send('Missing permitted files codeholder fields, check /perms');
		}

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(parSchema, codeholderQuery, req);
		if (!await codeholderQuery) {
			await cleanUp(file);
			return res.sendStatus(404);
		}

		// Try to load the picture
		let img;
		try {
			img = await Canvas.loadImage(file.path);
		} catch (e) {
			cleanUp(file);
			res.status(400).type('text/plain').send('Unable to load picture');
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
			pictures[size] = canvas.toBuffer(file.mimetype);
		}

		// Ensure the dir for the codeholder's profile picture exists
		const picDir = path.join(AKSO.conf.dataDir, 'codeholder_pictures', req.params.codeholderId);
		await fs.ensureDir(picDir);

		// Write all files
		const writePromises = [
			// Write the info file
			fs.writeFile(path.join(picDir, 'pic.txt'), JSON.stringify({
				mime: file.mimetype
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
			.where('id', req.params.codeholderId)
			.update({ hasProfilePicture: true });

		// Update datum history
		await AKSO.db('codeholders_hist_profilePicture')
			.insert({
				codeholderId: req.params.codeholderId,
				modTime: moment().unix(),
				modBy: req.user.modBy,
				modCmt: req.query.modCmt,
				hasProfilePicture: true
			});

		res.sendStatus(204);
		await cleanUp(file);
	}
};

async function cleanUp (file) {
	await fs.unlink(file.path);
}
