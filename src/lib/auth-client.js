import { default as merge } from 'deepmerge';

/**
 * An authenticated client, either using user auth or app auth
 */
export default class AuthClient {
	constructor (user, app) {
		this.user = user;
		this.app = app;
		this._perms = null;
		this._groups = null;
	}

	/**
	 * Whether the client is a user
	 * @return {boolean}
	 */
	isUser () {
		return !!this.user;
	}

	/**
	 * Whether the client is an app
	 * @return {boolean}
	 */
	isApp () {
		return !!this.app;
	}

	/**
	 * Gets all the client's permissions, not accounting for hardcoded business logic
	 * @return {Object} Properties:
	 * - `string[] perms` The client's raw permissions
	 * - `Object memberFilter` The client's codeholder access filter
	 * - `Object|null memberFields` The client's permitted codeholder fields
	 */
	async getPerms () {
		if (this._perms) { return this._perms; }

		this._perms = {
			perms: [],
			memberFields: {},
			memberFilter: {}
		};

		if (this.isUser()) {
			// Get groups
			const groups = await this.getGroups();

			// Group perms
			const groupPerms = await AKSO.db
				.select('permission')
				.from('admin_permissions_groups')
				.whereIn('adminGroupId', groups)
				.pluck('permission');
			this._perms.perms = groupPerms;

			// Group member restrictions
			const groupMemberRestrictions = await AKSO.db
				.select('filter', 'fields')
				.from('admin_permissions_memberRestrictions_groups')
				.whereIn('adminGroupId', groups);

			this._perms.memberFilter = merge.all(
				[ this._perms.memberFilter ]
					.concat(groupMemberRestrictions.map(x => x.filter))
			);

			for (let fields of groupMemberRestrictions.map(x => x.fields)) {
				if (fields === null) {
					this._perms.memberFields = null;
					break;
				}
				this._perms.memberFields = merge(
					this._perms.memberFields,
					fields
				);
			}

			// Add per-client overrides
			// Codeholder perms
			const codeholderPerms = await AKSO.db
				.select('permission')
				.from('admin_permissions_codeholders')
				.where('codeholderId', this.user)
				.pluck('permission');
			this._perms.perms = this._perms.perms.concat(codeholderPerms);

			// Codeholder member restrictions
			const memberRestrictions = await AKSO.db
				.first('filter', 'fields')
				.from('admin_permissions_memberRestrictions_codeholders')
				.where('codeholderId', this.user);
			if (memberRestrictions) {
				this._perms.memberFilter = merge(
					this._perms.memberFilter,
					memberRestrictions.filter
				);

				if (memberRestrictions.fields === null || this._perms.memberFields === null) {
					this._perms.memberFields = null;
				} else {
					this._perms.memberFields = merge(
						this._perms.memberFields,
						memberRestrictions.fields
					);
				}
			}
		} else if (this.isApp()) {
			// TODO
		}

		return this._perms;
	}

	/**
	 * Gets all admin groups the user belongs to
	 * @return {number[]} An array of group ids
	 */
	async getGroups () {
		if (this._groups) { return this._groups; }
		if (!this.isUser()) { return []; }

		this._groups = await AKSO.db
			.select('id')
			.from('admin_groups')
			.innerJoin('admin_groups_members', 'codeholderId', this.user)
			.orderBy('name')
			.pluck('id');

		return this._groups;
	}
}
