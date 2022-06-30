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
			memberFilter: { $and: [] }
		};

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

		this._perms.memberFilter.$and = groupMemberRestrictions
			.map(x => x.filter)
			.filter(x => Object.keys(x).length);
		if (!this._perms.memberFilter.$and.length) { this._perms.memberFilter = {}; }

		for (let fields of groupMemberRestrictions.map(x => x.fields)) {
			if (fields === null) {
				this._perms.memberFields = null;
				break;
			}
			// Merge the existing memberFields with the new ones
			for (const [field, flags] of Object.entries(fields)) {
				if (!(field in this._perms.memberFields)) {
					this._perms.memberFields[field] = flags;
					continue;
				}
				this._perms.memberFields[field] = [...new Set(this._perms.memberFields[field] + flags)].join('');
			}
		}

		// Add per-client overrides
		// Client perms
		const clientPermsQuery = AKSO.db
			.select('permission')
			.pluck('permission');

		if (this.isUser()) {
			clientPermsQuery
				.from('admin_permissions_codeholders')
				.where('codeholderId', this.user);
		} else if (this.isApp()) {
			clientPermsQuery
				.from('admin_permissions_clients')
				.where('apiKey', this.app);
		}
		this._perms.perms = this._perms.perms.concat(await clientPermsQuery);

		// Client member restrictions
		const memberRestrictionsQuery = AKSO.db
			.first('filter', 'fields');

		if (this.isUser()) {
			memberRestrictionsQuery
				.from('admin_permissions_memberRestrictions_codeholders')
				.where('codeholderId', this.user);
		} else if (this.isApp()) {
			memberRestrictionsQuery
				.from('admin_permissions_memberRestrictions_clients')
				.where('apiKey', this.app);
		}

		const memberRestrictions = await memberRestrictionsQuery;
		if (memberRestrictions) {
			this._perms.memberFilter = memberRestrictions.filter;

			if (memberRestrictions.fields === null || this._perms.memberFields === null) {
				this._perms.memberFields = null;
			} else {
				// Merge the existing memberFields with the new ones
				for (const [field, flags] of Object.entries(memberRestrictions.fields)) {
					if (!(field in this._perms.memberFields)) {
						this._perms.memberFields[field] = flags;
						continue;
					}
					this._perms.memberFields[field] = [...new Set(this._perms.memberFields[field] + flags)].join('');
				}
			}
		}

		return this._perms;
	}

	/**
	 * Gets all admin groups the user belongs to
	 * @return {number[]} An array of group ids
	 */
	async getGroups () {
		if (this._groups) { return this._groups; }

		const query = AKSO.db('admin_groups AS a').select('id');

		const self = this;
		if (this.isUser()) {
			query.innerJoin('admin_groups_members_codeholders AS ach', function () {
				this.on('a.id', 'ach.adminGroupId')
					.on('ach.codeholderId', AKSO.db.raw('?', [self.user]));
			});
		} else if (this.isApp()) {
			// Using raw joins here as knex errors when trying to join on a buffer
			query.joinRaw('inner join `admin_groups_members_clients` acl  on a.id = acl.adminGroupId AND acl.`apiKey` = ?', [ this.app ]);
		}

		query
			.orderBy('name')
			.pluck('id');

		this._groups = await query;
		return this._groups;
	}

	get modBy () {
		if (this.isUser()) { return 'ch:' + this.user; }
		else { return 'app:' + this.app.toString('hex'); }
	}

	async getNewCode () {
		if (!this.isUser()) { return null; }
		const userData = await AKSO.db('codeholders')
			.first('newCode')
			.where('id', this.user);
		return userData.newCode;
	}

	async isActiveMember () {
		if ('_isActiveMember' in this) { return this._isActiveMember; }
		if (!this.isUser()) { return false; }
		const result = await AKSO.db('membershipCategories_codeholders')
			.first(1)
			.leftJoin('membershipCategories', 'membershipCategories_codeholders.categoryId', 'membershipCategories.id')
			.whereRaw(`
				membershipCategories_codeholders.codeholderId = ?
				AND givesMembership
				AND (
					( NOT lifetime AND membershipCategories_codeholders.year = year(curdate()) )
					OR ( lifetime AND membershipCategories_codeholders.year <= year(curdate()) )
				)
			`, this.user);
		this._isActiveMember = !!result;
		return this._isActiveMember;
	}
}
