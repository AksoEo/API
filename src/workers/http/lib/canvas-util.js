import sharp from 'sharp';

/**
 * Crops an image to an array of image buffers of given sizes
 * @param  {mixed}        imgIn        The original image (see https://sharp.pixelplumbing.com/api-constructor)
 * @param  {number[]}     sizes        The sizes to crop to in px
 * @param  {boolean}      [toSquare]   Whether to crop the image to a square (alternatively reducing the largest dimension to the size)
 * @param  {boolean}      [includeOrg] Whether to include the original image
 * @return {object} An object like { org: Buffer, <size>: Buffer }
 */
export async function cropImgToSizes (imgIn, sizes, toSquare = false, includeOrg = false) {
	const orgImg = sharp(imgIn, {
		failOn: 'error',
	});
	const orgImgMetadata = await orgImg.metadata();

	const pictures = {};
	if (includeOrg) {
		pictures.org = await orgImg.toBuffer();
	}

	for (let size of sizes) {
		let img;
		if (toSquare) {
			img = orgImg
				.clone()
				.resize(size, size, {
					fit: 'contain',
					background: { r: 0, g: 0, b: 0, alpha: 0 },
					fastShrinkOnLoad: false,
				});
		} else {
			const aspectRatio = orgImgMetadata.width / orgImgMetadata.height;
			let newWidth, newHeight;
			if (aspectRatio > 1) {
				newWidth = size;
				newHeight = Math.round(size / aspectRatio);
			} else {
				newWidth = Math.round(size * aspectRatio);
				newHeight = size;
			}
			img = orgImg
				.clone()
				.resize(newWidth, newHeight, {
					fit: 'contain',
					background: { r: 0, g: 0, b: 0, alpha: 0 },
					fastShrinkOnLoad: false,
				});
		}
		
		pictures[size] = await img.toBuffer();
	}

	return pictures;
}
