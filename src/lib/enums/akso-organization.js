import Enum from './enum';

class AKSOOrganization extends Enum {
	static getDomain (prop) {
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
