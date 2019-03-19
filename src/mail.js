import sendgrid from '@sendgrid/mail';

export function init () {
	AKSO.mail = new sendgrid.MailService();
	AKSO.mail.setApiKey(AKSO.conf.sendgrid.apiKey);

	AKSO.log.info('Sendgrid mail client ready');
};
