<!--
  - SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useCurrentCategory } from '../../composables/useCurrentCategory'
import { AppStoreListViewCategories } from '../../constants/AppStoreConstants'
import { useAppStore } from '../../store/appStore'
import { useAppStoreSearchStore } from '../../store/appStoreSearch'

import AppStoreViewGrid from './AppStoreViewGrid.vue'
import AppStoreViewList from './AppStoreViewList.vue'
import AppStoreViewLoading from './AppStoreViewLoading.vue'
import AppStoreViewNotFound from './AppStoreViewNotFound.vue'
import AppStoreViewNoResults from './AppStoreViewNoResults.vue'

const store = useAppStore()
const searchStore = useAppStoreSearchStore()
const {
	currentCategory,
	currentCategoryName,
} = useCurrentCategory()

/** True if the category could not be found */
const invalidCategory = computed(() => currentCategoryName.value === undefined)
/** True if the current category should be displayed in a list-view */
const isListView = computed(() => AppStoreListViewCategories.includes(currentCategory.value))

/**
 * True if apps / categories are currently loading (being fetched)
 */
const isLoading = computed(() => store.loading.categories || store.loading.apps)
/**
 * True if there are no search results for the current query
 */
const noSearchResults = computed(() => searchStore.query !== '' && searchStore.searchResults.length === 0)
</script>

<template>
	<AppStoreViewLoading v-if="isLoading" />
	<AppStoreViewNotFound v-else-if="invalidCategory" />
	<AppStoreViewNoResults v-else-if="noSearchResults" />
	<AppStoreViewList v-else-if="isListView" />
	<AppStoreViewGrid v-else />
</template>
