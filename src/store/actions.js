/*
 - @copyright 2021 Arawa <TODO>
 -
 - @author 2021 Cyrille Bollu <cyrille@bollu.be>
 -
 - @license <TODO>
*/

import router from '../router'
import { ESPACE_MANAGERS_PREFIX, ESPACE_USERS_PREFIX, ESPACE_GID_PREFIX } from '../constants'
import { generateUrl } from '@nextcloud/router'
import axios from '@nextcloud/axios'

export default {
	// Adds a user to a group
	// The backend takes care of adding the user to the U- group, and Workspace Managers group if needed.
	addUserToGroup(context, { name, gid, user }) {
		// Update frontend
		context.commit('addUserToGroup', { name, gid, user })

		// Update backend and revert frontend changes if something fails
		const space = context.state.spaces[name]
		const url = generateUrl('/apps/workspace/api/group/addUser/{spaceId}', { spaceId: space.id })
		axios.patch(url, {
			gid,
			user: user.uid,
		}).then((resp) => {
			if (resp.status === 204) {
				// Everything went well, we can thus also add this user to the UGroup in the frontend
				context.commit('addUserToGroup', {
					name,
					gid: context.getters.UGroup(name).gid,
					user,
				})
				// eslint-disable-next-line no-console
				console.log('User ' + user.name + ' added to group ' + gid)
			} else {
				// Restore frontend and inform user
				context.commit('removeUserFromGroup', { name, gid, user })
				this._vm.$notify({
					title: t('workspace', 'Error'),
					text: t('workspace', 'An error occured while trying to add user ') + user.name
						+ t('workspace', ' to workspaces.') + '<br>'
						+ t('workspace', 'The error is: ') + resp.statusText,
					type: 'error',
				})
			}
		}).catch((e) => {
			// Restore frontend and inform user
			context.commit('removeUserFromGroup', { name, gid, user })
			console.error('The error is : ' + e)
			console.error('e.message', e.message)
			console.error('e.name', e.name)
			console.error('e.lineNumber', e.lineNumber)
			console.error('e.columnNumber', e.columnNumber)
			console.error('e.stack', e.stack)
			this._vm.$notify({
				title: t('workspace', 'Network error'),
				text: t('workspace', 'A network error occured while trying to add user ') + user.name
					+ t('workspace', ' to workspaces.') + '<br>'
					+ t('workspace', 'The error is: ') + e,
				type: 'error',
			})
		})
	},
	// Creates a group and navigates to its details page
	createGroup(context, { name, group }) {
		// Groups must be postfixed with the ID of the space they belong
		const space = context.state.spaces[name]
		group = group + '-' + space.id

		// Creates group in frontend
		context.commit('addGroupToSpace', { name, group })

		// Creates group in backend
		axios.post(generateUrl(`/apps/workspace/api/group/${group}`), { spaceId: space.id })
			.then((resp) => {
				if (resp.status === 200) {
					// Navigates to the group's details page
					context.state.spaces[name].isOpen = true
					router.push({
						path: `/group/${name}/${group}`,
					})
					// eslint-disable-next-line no-console
					console.log('Group ' + group + ' created')
				} else {
					context.commit('removeGroupFromSpace', { name, group })
					this._vm.$notify({
						title: t('workspace', 'Error'),
						text: t('workspace', 'An error occured while trying to create group ') + group + t('workspace', '<br>The error is: ') + resp.statusText,
						type: 'error',
					})
				}
			})
			.catch((e) => {
				context.commit('removeGroupFromSpace', { name, group })
				this._vm.$notify({
					title: t('workspace', 'Network error'),
					text: t('workspace', 'A network error occured while trying to create group ') + group + t('workspace', '<br>The error is: ') + e,
					type: 'error',
				})
			})
	},
	// Deletes a group
	deleteGroup(context, { name, group }) {
		const space = context.state.spaces[name]

		// Deletes group from frontend
		context.commit('removeGroupFromSpace', { name, group })

		// Naviagte back to home
		router.push({
			path: '/',
		})

		// Deletes group from backend
		axios.delete(generateUrl(`/apps/workspace/api/group/${group}`), { data: { spaceId: space.id } })
			.then((resp) => {
				if (resp.status === 200) {
					// eslint-disable-next-line no-console
					console.log('Group ' + group + ' deleted')
				} else {
					context.commit('addGroupToSpace', { name, group })
					// TODO Inform user
				}
			})
			.catch((e) => {
				context.commit('addGroupToSpace', { name, group })
				// TODO Inform user
			})
	},
	// Deletes a space
	removeSpace(context, { space }) {
		context.commit('deleteSpace', {
			space,
		})
	},
	// Removes a user from a group
	removeUserFromGroup(context, { name, gid, user }) {
		const space = context.state.spaces[name]
		const backupGroups = space.users[user.uid].groups
		// Update frontend
		if (gid.startsWith(ESPACE_GID_PREFIX + ESPACE_USERS_PREFIX)) {
			context.commit('removeUserFromWorkspace', { name, user })
		} else {
			context.commit('removeUserFromGroup', { name, gid, user })
		}
		// Update backend and revert frontend changes if something fails
		const url = generateUrl('/apps/workspace/api/group/delUser/{spaceId}', { spaceId: space.id })
		axios.patch(url, {
			gid,
			user: user.uid,
		}).then((resp) => {
			if (resp.data.statuscode === 204) {
				// eslint-disable-next-line no-console
				console.log('User ' + user.name + ' removed from group ' + gid)
			} else {
				this._vm.$notify({
					title: t('workspace', 'Error'),
					text: t('workspace', 'An error occured while removing user from group ') + gid + t('workspace', '<br>The error is: ') + resp.statusText,
					type: 'error',
				})
				context.commit('addUserToGroup', { name, gid, user })
			}
		}).catch((e) => {
			this._vm.$notify({
				title: t('workspace', 'Network error'),
				text: t('workspace', 'A network error occured while removing user from group ') + gid + t('workspace', '<br>The error is: ') + e,
				type: 'error',
			})
			if (gid.startsWith(ESPACE_GID_PREFIX + ESPACE_USERS_PREFIX)) {
				backupGroups.forEach(group =>
					context.commit('addUserToGroup', { name, group, user })
				)
			} else {
				context.commit('addUserToGroup', { name, gid, user })
			}
		})
	},
	// Renames a group and navigates to its details page
	renameGroup(context, { name, gid, newGroupName }) {
		const space = context.state.spaces[name]
		const oldGroupName = space.groups[gid].displayName

		// Groups must be postfixed with the ID of the space they belong
		newGroupName = newGroupName + '-' + space.id

		// Creates group in frontend
		context.commit('renameGroup', { name, gid, newGroupName })

		// Creates group in backend
		axios.patch(generateUrl(`/apps/workspace/api/group/${gid}`), { spaceId: space.id, newGroupName })
			.then((resp) => {
				if (resp.status === 200) {
					// Navigates to the group's details page
					context.state.spaces[name].isOpen = true
					// eslint-disable-next-line no-console
					console.log('Group ' + gid + ' renamed to ' + newGroupName)
				} else {
					context.commit('renameGroup', { name, gid, oldGroupName })
					// TODO Inform user
				}
			})
			.catch((e) => {
				context.commit('renameGroup', { name, gid, oldGroupName })
				// TODO Inform user
			})
	},
	// Change a user's role from admin to user (or the opposite way)
	toggleUserRole(context, { name, user }) {
		const space = context.state.spaces[name]
		if (context.getters.isGeneralManager(user, name)) {
			user.groups.splice(user.groups.indexOf(ESPACE_GID_PREFIX + ESPACE_MANAGERS_PREFIX + space.id), 1)
		} else {
			user.groups.push(ESPACE_GID_PREFIX + ESPACE_MANAGERS_PREFIX + space.id)
		}
		context.commit('updateUser', { name, user })
		axios.patch(generateUrl('/apps/workspace/api/space/{spaceId}/user/{userId}', {
			spaceId: space.id,
			userId: user.uid,
		}))
			.then((resp) => {
				if (resp.status === 200) {
					// eslint-disable-next-line no-console
					console.log('Role of user ' + user.name + ' changed')
				} else {
					// Revert action an inform user
					if (context.getters.isGeneralManager(user, name)) {
						user.groups.splice(user.groups.indexOf(ESPACE_GID_PREFIX + ESPACE_MANAGERS_PREFIX + space.id), 1)
					} else {
						user.groups.push(ESPACE_GID_PREFIX + ESPACE_MANAGERS_PREFIX + space.id)
					}
					context.commit('updateUser', { name, user })
					this._vm.$notify({
						title: t('workspace', 'Error'),
						text: t('workspace', 'An error occured while trying to change the role of user ') + user.name + t('workspace', '.<br>The error is: ') + resp.statusText,
						type: 'error',
					})
				}
			}).catch((e) => {
				// Revert action an inform user
				if (context.getters.isGeneralManager(user, name)) {
					user.groups.splice(user.groups.indexOf(ESPACE_GID_PREFIX + ESPACE_MANAGERS_PREFIX + space.id), 1)
				} else {
					user.groups.push(ESPACE_GID_PREFIX + ESPACE_MANAGERS_PREFIX + space.id)
				}
				context.commit('updateUser', { name, user })
				this._vm.$notify({
					title: t('workspace', 'Network error'),
					text: t('workspace', 'An error occured while trying to change the role of user ') + user.name + t('workspace', '.<br>The error is: ') + e,
					type: 'error',
				})
			})
	},
	updateSpace(context, { space }) {
		context.commit('updateSpace', space)
	},
	setSpaceQuota(context, { name, quota }) {
		// Updates frontend
		const oldQuota = context.getters.quota(name)
		context.commit('setSpaceQuota', { name, quota })

		// Transforms quota for backend
		switch (quota.substr(-2).toLowerCase()) {
		case 'tb':
			quota = quota.substr(0, quota.length - 2) * 1024 ** 4
			break
		case 'gb':
			quota = quota.substr(0, quota.length - 2) * 1024 ** 3
			break
		case 'mb':
			quota = quota.substr(0, quota.length - 2) * 1024 ** 2
			break
		case 'kb':
			quota = quota.substr(0, quota.length - 2) * 1024
			break
		}
		quota = (quota === 'unlimited') ? -3 : quota

		// Updates backend
		const space = context.state.spaces[name]
		const url = generateUrl(`/apps/groupfolders/folders/${space.groupfolderId}/quota`)
		axios.post(url, { quota })
			.then(resp => {
				if (resp.status !== 200) {
					// Reverts change made in the frontend in case of error
					context.commit('setSpaceQuota', { name, oldQuota })
					this._vm.$notify({
						title: t('workspace', 'Error'),
						text: t('workspace', 'An error occured while trying to update the workspace\'s quota.<br>The error is: ') + resp.statusText,
						type: 'error',
					})
				}
			})
			.catch((e) => {
				// Reverts change made in the frontend in case of error
				context.commit('setSpaceQuota', { name, oldQuota })
				this._vm.$notify({
					title: t('workspace', 'Network error'),
					text: t('workspace', 'A network error occured while trying to update the workspace\'s quota.<br>The error is: ') + e,
					type: 'error',
				})
			})
	},
	updateColor(context, { name, colorCode }) {
		context.commit('UPDATE_COLOR', { name, colorCode })
	},
}
