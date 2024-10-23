/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router/composables'
import { AppStoreSectionNames } from '../constants/AppStoreConstants'
import { useAppStore } from '../store/appStore'

/**
 * Get the current category of the app store
 */
export function useCurrentCategory() {
	const route = useRoute()
	const store = useAppStore()

	const currentCategory = computed(() => route.params.category ?? route.params.name!)
	const currentCategoryName = computed(() => AppStoreSectionNames[currentCategory.value] ?? store.getCategoryById(currentCategory.value)?.displayName)

	return {
		currentCategory,
		/** The display name of the current category */
		currentCategoryName,
	}
}