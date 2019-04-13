import Enum from './enum';

class AKSOOrganization extends Enum {
	static getDomain (prop) {
		if (AKSO.conf.prodMode === 'dev') { return 'http://127.0.0.1:2576'; }

		switch (this.normalize(prop)) {
		case 'AKSO':
			return 'https://admin.akso.org';
		case 'TEJO':
			return 'https://tejo.org';
		case 'UEA':
			return 'https://uea.org';
		}
	}
}
AKSOOrganization.setProps('akso', 'tejo', 'uea');

export default AKSOOrganization;
