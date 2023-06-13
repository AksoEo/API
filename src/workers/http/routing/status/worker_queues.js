import { WorkerQueues, getQueueInfo } from 'akso/queue';

export default {
	schema: {
		body: null,
		query: null,
		requirePerms: 'status.worker_queues',
	},

	run: async function run (req, res) {
		const queues = Object.keys(WorkerQueues);

		const queueInfo = await Promise.all(queues.map(queue => {
			return getQueueInfo(WorkerQueues[queue]);
		}));

		res.sendObj(queueInfo);	
	},
};
