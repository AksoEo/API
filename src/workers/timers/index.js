import * as schedulableTimers from './timers';
/**
 * Sets up AKSO timers
 */
export async function init () {
	for (const timer of Object.values(schedulableTimers)) {
		registerTimer(timer.name, timer.intervalMs, timer);
	}
}

const timers = {};
export function registerTimer (name, intervalMs, fn, disregardExecutionTime = false) {
	const timer = timers[name] = {
		intervalMs,
		fn,
		disregardExecutionTime,
		fnParent: async function aksoTimer () {
			const timeBefore = process.hrtime.bigint();
			try {
				await Promise.resolve(fn());
			} catch (e) {
				AKSO.log.error(`An error occured in timer ${name}, exiting`);
				AKSO.log.error(e);
				process.exit(1);
			}
			const timeNow = process.hrtime.bigint();
			const timeDiffMs = Number((timeNow - timeBefore) / (10n**6n));
			let waitTimeMs = intervalMs;
			if (!disregardExecutionTime) { waitTimeMs -= timeDiffMs; }
			waitTimeMs = Math.max(200, waitTimeMs); // always wait at least 200ms
			setTimeout(timer.fnParent, waitTimeMs);
		}
	};

	timer.fnParent();
}
