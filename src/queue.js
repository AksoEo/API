import Connection from 'rabbitmq-client';
import msgpack from 'msgpack-lite';

export const WorkerQueues = {
	SEND_EMAIL: 'AKSO_SEND_EMAIL',
	SEND_TELEGRAM: 'AKSO_SEND_TELEGRAM',
	ADDRESS_LABELS: 'AKSO_ADDRESS_LABELS',
};

let _rabbit = null;
export function getConnection () {
	if (!_rabbit) {
		_rabbit = new Connection({
			url: AKSO.conf.rabbitmq,
			retryLow: 500,
			retryHigh: 10000,
		});
	}
	return _rabbit;
}

let isClosing = false;
let _channel = null;
export async function getChannel () {
	const rabbit = getConnection();
	if (!_channel) {
		_channel = await rabbit.acquire();

		_channel.on('close', () => {
			if (!isClosing) {
				AKSO.log.error('Connection to RabbitMQ was unexpectedly closed, terminating.');
				process.exit(1);
			}
		});

		await _channel.confirmSelect();
	}
	return _channel;
}

export async function close () {
	if (!_channel) { return; }
	const rabbit = getConnection();
	const channel = await getChannel();
	isClosing = true;
	await channel.close();
	await rabbit.close();
}

const queues = [];
export async function createQueue (queue) {
	// Delete old queue from the array if it exists
	let queueIndex = queues.indexOf(queue);
	if (queueIndex > -1) {
		queues.splice(queueIndex, 1);

	}
	const channel = await getChannel();
	const res = await channel.queueDeclare({
		queue,
		durable: true,
	});
	queues.push(queue);
	return res;
}

export async function getQueueInfo (queue) {
	let queueRes;
	if (!queues.includes(queue)) {
		queueRes = await createQueue(queue);
	} else {
		const channel = await getChannel();
		// only checks state
		queueRes = await channel.queueDeclare({
			queue,
			durable: true,
			passive: true,
		});
	}
	return queueRes;
}

export async function addToQueue (queue, data) {
	if (!queues.includes(queue)) {
		await createQueue(queue);
	}
	const channel = await getChannel();
	const encodedData = msgpack.encode(data, { codec: AKSO.msgpack });
	await channel.basicPublish({ routingKey: queue, durable: true }, encodedData);
}

export async function createConsumer (queue, listener) {
	if (!queues.includes(queue)) {
		await createQueue(queue);
	}
	const channel = await getChannel();
	await channel.basicConsume({ queue }, function createConsumerListener (msg) {
		const data = msgpack.decode(msg.body, { codec: AKSO.msgpack });
		listener(data)
			.then(() => channel.basicAck({ deliveryTag: msg.deliveryTag }))
			.catch(err => {
				channel.basicNack({
					deliveryTag: msg.deliveryTag,
					requeue: false,
				});
				AKSO.log.warn(`An error occured in queue ${queue}:\n${err.stack ?? err}`);
			});
	});
}
