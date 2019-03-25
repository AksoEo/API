import sendgrid from '@sendgrid/mail';

export async function init () {
	AKSO.log.info('Establishing connection to Sendgrid mail server ...');

	AKSO.mail = new sendgrid.MailService();
	AKSO.mail.setApiKey(AKSO.conf.sendgrid.apiKey);

	AKSO.log.info('... Sendgrid mail client ready');
};
