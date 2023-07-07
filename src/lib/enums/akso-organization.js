import Enum from './enum';

class AKSOOrganization extends Enum {
	// Returns the primary domain for the website (grav or AKSO Admin)
	static getDomain (prop) {
		switch (this.normalize(prop)) {
		case 'AKSO':
			return 'https://admin.akso.org';
		case 'TEJO':
			return 'https://uea.org'; // TODO: Change me when tejo.org runs akso-grav
		case 'UEA':
			return 'https://uea.org';
		}
	}

	// Permitted email-sender domains
	static domains = {
		AKSO: [ 'akso.org' ],
		TEJO: [ 'tejo.org' ],
		UEA:  [ 'uea.org', 'co.uea.org' ],
	};

	static getEmailDomains (prop) {
		return AKSOOrganization.domains[this.normalize(prop)];
	}


}
AKSOOrganization.setProps('akso', 'tejo', 'uea');

export default AKSOOrganization;
