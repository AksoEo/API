import sendgrid from '@sendgrid/mail';

export default function init () {
	AKSO.mail = new sendgrid.MailService();
	AKSO.mail.setApiKey(AKSO.conf.sendgrid.apiKey);
};
