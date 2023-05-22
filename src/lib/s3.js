import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand, DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const BUCKET = AKSO.conf.s3.bucket;

export const s3Client = new S3Client({
	endpoint: AKSO.conf.s3.endpoint,
	region: AKSO.conf.s3.region,
	credentials: {
		accessKeyId: AKSO.conf.s3.accessKeyId,
		secretAccessKey: AKSO.conf.s3.secretAccessKey,
	},
	s3BucketEndpoint: true,
});

export async function putObject ({
	params = {},
	body,
	key, // Only key or keyPrefix are required
	keyPrefix,
	acl = undefined,
	contentType = undefined,
} = {}) {
	let s3Key = key;
	if (!key) {
		if (!keyPrefix) {
			throw new Error('Either key or keyPrefix must be defined');
		}
		s3Key = keyPrefix + '-' + uuidv4();
	}

	const res = await s3Client.send(new PutObjectCommand({
		Bucket: BUCKET,
		Body: body,
		Key: s3Key,
		ACL: acl,
		ContentType: contentType,
		...params,
	}));

	return {
		key: s3Key,
		res,
	};
}

export async function deleteObjects ({
	params = {},
	keys,
} = {}) {
	const promises = [];
	// s3 limits us to 1000 objects per request
	for (let i = 0; i < keys.length; i += 1000) {
		const keyChunk = keys.slice(i, i + 1000);

		promises.push(s3Client.send(new DeleteObjectsCommand({
			Bucket: BUCKET,
			Delete: {
				Objects: keyChunk.map(key => {
					return { Key: key, };
				}),
			},
			...params,
		})));
	}
	return Promise.all(promises);
}

export async function deleteObject (key, params = {}) {
	return s3Client.send(new DeleteObjectCommand({
		Bucket: BUCKET,
		Key: key,
		...params,
	}));
}

export async function getSignedURLObjectGET ({
	params = {},
	key,
	expiresIn = 30 * 60 * 60, // seconds, default is half an hour
} = {}) {
	return getSignedUrl(s3Client, new GetObjectCommand({
		Bucket: BUCKET,
		Key: key,
		...params,
	}), { expiresIn });
}

export function getPublicObjectURL (key) {
	return new URL(`/${BUCKET}/${key}`, AKSO.conf.s3.endpoint).toString();
}
