import * as Canvas from 'canvas';

/**
 * Crops a Canvas.Image to an array of image buffers of given sizes
 * @param  {Canvas.Image} img        The original image
 * @param  {string}       mimeType   The mime type to output as
 * @param  {number[]}     sizes      The sizes to crop to in px
 * @param  {boolean}      [toSquare] Whether to crop the image to a square (alternatively reducing the largest dimension to the size)
 * @return {object} An object of size:Buffer
 */
export function cropImgToSizes (img, mimeType, sizes, toSquare = false) {
	const pictures = {};
	for (let size of sizes) {
		let canvas;
		if (toSquare) {
			canvas = Canvas.createCanvas(size, size);
			const ctx = canvas.getContext('2d');
			const hRatio = canvas.width / img.width;
			const vRatio = canvas.height / img.height;
			const ratio = Math.max(hRatio, vRatio);
			const centerShiftX = (canvas.width - img.width * ratio) / 2;
			const centerShiftY = (canvas.height - img.height * ratio) / 2;
			ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
		} else {
			const aspectRatio = img.width / img.height;
			let newWidth, newHeight;
			if (aspectRatio > 1) {
				newWidth = size;
				newHeight = size / aspectRatio;
			} else {
				newWidth = size * aspectRatio;
				newHeight = size;
			}
			canvas = Canvas.createCanvas(newWidth, newHeight);
			const ctx = canvas.getContext('2d');
			ctx.drawImage(img, 0, 0, newWidth, newHeight);
		}
		
		pictures[size] = canvas.toBuffer(mimeType);
	}

	return pictures;
}
