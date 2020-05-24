import fs from 'fs-extra';
import path from 'path';

/**
 * Deletes the given path and every level up until (including) maxLevel stopping only when hitting a non-empty dir
 * @param  {string} maxLevel The maximum inclusive level to delete if all parents of rmPath are empty
 * @param  {string} rmPath   The path to delete
 */
export async function removePathAndEmptyParents (maxLevel, rmPath) {
	await fs.remove(rmPath);

	let curPath = rmPath;
	while (path.relative(maxLevel, curPath).length > 0) {
		curPath = path.resolve(curPath, '..');
		try {
			await fs.rmdir(curPath);
		} catch (e) {
			if (e.code === 'ENOTEMPTY') { return; }
			if (e.code === 'ENOENT') { continue; }
			throw e;
		}
	}
}
