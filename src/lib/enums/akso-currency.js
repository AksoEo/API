import Enum from './enum';

const zeroDecimalFactors = {
	AUD: 100,
	CAD: 100,
	CHF: 100,
	DKK: 100,
	EUR: 100,
	GBP: 100,
	HKD: 100,
	JPY: 1,
	MXN: 100,
	MYR: 100,
	NOK: 100,
	NZD: 100,
	PLN: 100,
	SEK: 100,
	SGD: 100,
	USD: 100
};

class AKSOCurrency extends Enum {
	static getZeroDecimalFactor (prop) {
		return zeroDecimalFactors[this.normalize(prop)];
	}
}
AKSOCurrency.setProps(...Object.keys(zeroDecimalFactors));

export default AKSOCurrency;
