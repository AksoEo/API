import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';
import moment from 'moment-timezone';

import SimpleResource from './simple-resource';

/**
 * A resource representing a codeholder
 */
class CodeholderResource extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);

		const fields = req.query.fields || schema.defaultFields;

		const except = [];

		// Change field formats
		if (fields.some(f => f.indexOf('address.') === 0)) {
			except.push('address');
			this.obj.address = {
				country:		fields.indexOf('address.country') > -1 ? this.obj.address_country : undefined,
				countryArea:	this.obj.address_countryArea,
				city:			this.obj.address_city,
				cityArea:		this.obj.address_cityArea,
				streetAddress:	this.obj.address_streetAddress,
				postalCode:		this.obj.address_postalCode,
				sortingCode:	this.obj.address_sortingCode
			};
		}

		if (fields.some(f => f.indexOf('addressLatin.') === 0)) {
			except.push('addressLatin');
			this.obj.addressLatin = {
				country:		fields.indexOf('addressLatin.country') > -1 ? this.obj.address_country : undefined,
				countryArea:	this.obj.address_countryArea_latin,
				city:			this.obj.address_city_latin,
				cityArea:		this.obj.address_cityArea_latin,
				streetAddress:	this.obj.address_streetAddress_latin,
				postalCode:		this.obj.address_postalCode_latin,
				sortingCode:	this.obj.address_sortingCode_latin
			};
		}

		this.obj.enabled           = !!this.obj.enabled;
		this.obj.isDead            = !!this.obj.isDead;
		this.obj.hasPassword       = !!this.obj.hasPassword;
		this.obj.isActiveMember    = !!this.obj.isActiveMember;
		this.obj.addressInvalid    = !!this.obj.addressInvalid;

		if ('addressCountryGroups' in this.obj) {
			if (typeof this.obj.addressCountryGroups === 'string') {
				this.obj.addressCountryGroups = this.obj.addressCountryGroups.split(',');
			} else {
				this.obj.addressCountryGroups = [];
			}
		}
		if ('feeCountryGroups' in this.obj) {
			if (typeof this.obj.feeCountryGroups === 'string') {
				this.obj.feeCountryGroups = this.obj.feeCountryGroups.split(',');
			} else {
				this.obj.feeCountryGroups = [];
			}
		}

		if (this.obj.notes === null) { this.obj.notes = ''; }
		if (this.obj.birthdate) { this.obj.birthdate = moment(this.obj.birthdate).format('Y-MM-DD'); }
		if (this.obj.deathdate) { this.obj.deathdate = moment(this.obj.deathdate).format('Y-MM-DD'); }
		
		if (fields.includes('officePhoneFormatted')) {
			if (this.obj.officePhone) {
				this.obj.officePhoneFormatted = formatPhoneNumber(this.obj.officePhone);
			} else {
				this.obj.officePhoneFormatted = null;
			}
		}
		if (fields.includes('landlinePhoneFormatted')) {
			if (this.obj.landlinePhone) {
				this.obj.landlinePhoneFormatted = formatPhoneNumber(this.obj.landlinePhone);
			} else {
				this.obj.landlinePhoneFormatted = null;
			}
		}
		if (fields.includes('cellphoneFormatted')) {
			if (this.obj.cellphone) {
				this.obj.cellphoneFormatted = formatPhoneNumber(this.obj.cellphone);
			} else {
				this.obj.cellphoneFormatted = null;
			}
		}

		// Remove fields not belonging to this codeholder type
		let deleteProps = [];
		if (this.obj.codeholderType !== 'org') {
			deleteProps = [
				'fullName',
				'fullNameLocal',
				'careOf',
				'nameAbbrev'
			];
		} else if (this.obj.codeholderType !== 'human') {
			deleteProps = [
				'firstName',
				'firstNameLegal',
				'lastName',
				'lastNameLegal',
				'lastNamePublicity',
				'honorific',
				'birthdate',
				'age',
				'agePrimo',
				'profession',
				'landlinePhone',
				'landlinePhoneFormatted',
				'landlinePhonePublicity',
				'cellphone',
				'cellphoneFormatted',
				'cellphonePublicity'
			];
		}
		deleteProps.forEach(x => delete this.obj[x]);

		this.removeUnnecessary(fields.concat(except));
	}
}

export default CodeholderResource;

const phoneUtil = PhoneNumberUtil.getInstance();
function formatPhoneNumber (number) {
	try {
		const numberObj = phoneUtil.parse(number);
		return phoneUtil.format(numberObj, PhoneNumberFormat.INTERNATIONAL);
	} catch (e) {
		return number;
	}
}
