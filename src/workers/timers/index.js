import * as schedulableTimers from './timers';
/**
 * Sets up AKSO timers
 */
export async function init () {
	for (const timer of Object.values(schedulableTimers)) {
		registerTimer({
			name: timer.name, 
			intervalMs: timer.intervalMs, 
			fn: timer,
			disregardExecutionTime: timer.disregardExecutionTime
		});
	}
}

const timers = {};
/**
 * Registers a new timer
 * @param  {Object}   options
 * @param  {string}   options.name                     The name of the timer
 * @param  {number}   options.intervalMs               The interval of the timer in milliseconds
 * @param  {Function} options.fn                       The function to run
 * @param  {boolean}  [options.disregardExecutionTime] Whether to use the exact value of `intervalMs` without subtracting the execution time of `fn`
 */
function registerTimer ({ name, intervalMs, fn, disregardExecutionTime = false } = {}) {
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
				console.error(e); // eslint-disable-line no-console
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
