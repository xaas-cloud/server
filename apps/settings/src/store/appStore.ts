/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IAppStoreApp, IAppStoreCategory } from '../constants/AppStoreTypes.ts'

import { showError } from '@nextcloud/dialogs'
import { loadState } from '@nextcloud/initial-state'
import { translate as t } from '@nextcloud/l10n'
import { defineStore } from 'pinia'

import { getAllApps, getCategories } from '../service/AppStoreApi.ts'
import AppStoreCategoryIcons from '../constants/AppStoreCategoryIcons.ts'
import logger from '../logger'
import Vue from 'vue'

const showApiError = () => showError(t('settings', 'An error occurred during the request. Unable to proceed.'))

export const useAppStore = defineStore('settings-apps', {
	state: () => ({
		apps: [] as IAppStoreApp[],
		categories: [] as IAppStoreCategory[],
		updateCount: loadState<number>('settings', 'appstoreUpdateCount', 0),
		loading: {
			apps: false,
			categories: false,
		},
		loadingList: false,
		gettingCategoriesPromise: null,
	}),

	actions: {
		/**
		 * Helper to modify an app in the local app store.
		 * @param app The app to modify
		 * @param partialApp Changes to apply to the app
		 */
		updateApp(app: IAppStoreApp, partialApp: Partial<IAppStoreApp>) {
			const updatedApp = structuredClone(app)
			for (const [key, value] of Object.entries(partialApp)) {
				if (value === undefined) {
					delete updatedApp[key]
				} else {
					updatedApp[key] = value
				}
			}

			const index = this.apps.findIndex((a) => a.id === app.id)
			Vue.set(this.apps, index, updatedApp)
		},

		async loadCategories(force = false) {
			if (this.categories.length > 0 && !force) {
				return
			}

			try {
				this.loading.categories = true
				const categories = await getCategories()

				for (const category of categories) {
					category.icon = AppStoreCategoryIcons[category.id] ?? ''
				}

				this.categories = categories
			} catch (error) {
				logger.error(error as Error)
				showApiError()
			} finally {
				this.loading.categories = false
			}
		},

		async loadApps(force = false) {
			if (this.apps.length > 0 && !force) {
				return
			}

			try {
				this.loading.apps = true
				const apps = await getAllApps()
				this.apps = apps
			} catch (error) {
				logger.error(error as Error)
				showApiError()
			} finally {
				this.loading.apps = false
			}
		},

		getCategoryById(categoryId: string) {
			return this.categories.find(({ id }) => id === categoryId) ?? null
		},

		/**
		 * Get an app by their app id
		 * @param appId The app id to search
		 */
		getAppById(appId: string): IAppStoreApp|null {
			return this.apps.find(({ id }) => id === appId) ?? null
		},

		/**
		 * Get all apps that are part of the specified bundle
		 * @param bundleId The bundle id to filter
		 */
		getAppsByBundle(bundleId: string): IAppStoreApp[] {
			return this.apps.filter((app) => app.bundleIds && app.bundleIds.includes(bundleId))
		},

		/**
		 * Get all apps that are listed in the specified category
		 * @param categoryId The category id to filter
		 */
		getAppsByCategory(categoryId: string): IAppStoreApp[] {
			// Also handle special categories
			switch (categoryId) {
				case 'enabled':
					return this.apps.filter((app) => app.active)
					break
				case 'disabled':
					return this.apps.filter((app) => app.installed && !app.active)
					break
				case 'updates':
					return this.apps.filter((app) => app.update)
					break
				case 'installed':
					return this.apps.filter((app) => app.installed)
					break
				case 'featured':
					return this.apps.filter((app) => app.level === 200)
					break
				case 'supported':
					return this.apps.filter((app) => app.level === 300)
				default:
					return this.apps.filter((app) => app.category === categoryId || app.category.includes(categoryId))
				}
		},
	},
})
