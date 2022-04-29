import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import method$get from './get';
import method$patch from './patch';

import endpoint$intermediary_pdf from './intermediary_pdf';

import operation$cancel from './!cancel';
import operation$mark_disputed from './!mark_disputed';
import operation$mark_refunded from './!mark_refunded';
import operation$mark_succeeded from './!mark_succeeded';
import operation$send_receipt from './!send_receipt';
import operation$set_purpose_validity from './!set_purpose_validity';
import operation$submit from './!submit';

/**
 * Sets up /aksopay/payment_intents/{paymentIntentId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'patch', method$patch);

	bindMethod(router, '/intermediary_pdf', 'get', endpoint$intermediary_pdf);

	bindMethod(router, '/!cancel', 'post', operation$cancel);
	bindMethod(router, '/!mark_disputed', 'post', operation$mark_disputed);
	bindMethod(router, '/!mark_refunded', 'post', operation$mark_refunded);
	bindMethod(router, '/!mark_succeeded', 'post', operation$mark_succeeded);
	bindMethod(router, '/!send_receipt', 'post', operation$send_receipt);
	bindMethod(router, '/!set_purpose_validity', 'post', operation$set_purpose_validity);
	bindMethod(router, '/!submit', 'post', operation$submit);

	return router;
}
