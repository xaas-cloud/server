/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import type { RouteConfig } from 'vue-router'
import { loadState } from '@nextcloud/initial-state'

const appstoreEnabled = loadState<boolean>('settings', 'appstoreEnabled', true)

// Dynamic loading
const AppStore = () => import(/* webpackChunkName: 'settings-apps-view' */'../views/AppStore/AppStore.vue')
const AppStoreAppsSection = () => import(/* webpackChunkName: 'settings-apps-view' */ '../views/AppStore/AppStoreSectionApps.vue')
const AppStoreDiscoverSection = () => import(/* webpackChunkName: 'settings-apps-view' */ '../views/AppStore/AppStoreSectionDiscover.vue')
const AppStoreNavigation = () => import(/* webpackChunkName: 'settings-apps-view' */'../views/AppStore/AppStoreNavigation.vue')
const AppStoreSidebar = () => import(/* webpackChunkName: 'settings-apps-view' */'../views/AppStore/AppStoreSidebar.vue')

const UserManagement = () => import(/* webpackChunkName: 'settings-users' */'../views/UserManagement.vue')
const UserManagementNavigation = () => import(/* webpackChunkName: 'settings-users' */'../views/UserManagementNavigation.vue')

const routes: RouteConfig[] = [
	{
		name: 'users',
		path: '/:index(index.php/)?settings/users',
		components: {
			default: UserManagement,
			navigation: UserManagementNavigation,
		},
		props: true,
		children: [
			{
				path: ':selectedGroup',
				name: 'group',
			},
		],
	},
	{
		path: '/:index(index.php/)?settings/apps',
		name: 'apps',
		redirect: {
			...(appstoreEnabled
				? { name: 'discover' }
				: {
					name: 'apps-category',
					params: {
						category: 'installed',
					},
				}
			),
		},
		components: {
			default: AppStore,
			navigation: AppStoreNavigation,
			sidebar: AppStoreSidebar,
		},
		children: [
			{
				name: 'discover',
				path: 'discover/:appId?',
				component: AppStoreDiscoverSection,
			},
			{
				path: ':category',
				name: 'app-category',
				component: AppStoreAppsSection,
				children: [
					{
						path: ':appId',
						name: 'app-details',
					},
				],
			},
		],
	},
]

export default routes
