/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IAppStoreApp } from '../constants/AppStoreTypes'

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAppStore } from './appStore'

export const useAppStoreSearchStore = defineStore('app-store-search', () => {
	const appStore = useAppStore()

	/**
	 * The current search query
	 */
	const query = ref('')

	const searchResults = computed(() => {
		if (query.value === '') {
			return []
		}
		return appStore.apps
			.filter(filterAppsByQuery)
	})

	/**
	 * Return true if the app would be included with current search query, false otherwise.
	 * @param app app to check
	 */
	function filterAppsByQuery(app: IAppStoreApp): boolean {
		if (query.value === '') {
			return true
		}

		const lowerCaseQuery = query.value.toLocaleLowerCase()
		return app.id.toLocaleLowerCase().includes(lowerCaseQuery)
			|| app.name.toLocaleLowerCase().includes(lowerCaseQuery)
	}

	return {
		filterAppsByQuery,
		query,
		searchResults,
	}
})
