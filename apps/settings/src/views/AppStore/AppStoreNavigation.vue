<!--
  - SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<!-- Categories & filters -->
	<NcAppNavigation :aria-label="t('settings', 'Apps')">
		<template #search>
			<NcAppNavigationSearch v-model="searchStore.query" />
		</template>
		<template #list>
			<NcAppNavigationItem v-if="appstoreEnabled"
				id="app-category-discover"
				:to="{ name: 'discover' }"
				:name="AppStoreSectionNames.discover">
				<template #icon>
					<NcIconSvgWrapper :path="AppStoreCategoryIcons.discover" />
				</template>
			</NcAppNavigationItem>
			<NcAppNavigationItem id="app-category-installed"
				:to="{ name: 'app-category', params: { category: 'installed'} }"
				:name="AppStoreSectionNames.installed">
				<template #icon>
					<NcIconSvgWrapper :path="AppStoreCategoryIcons.installed" />
				</template>
			</NcAppNavigationItem>
			<NcAppNavigationItem id="app-category-enabled"
				:to="{ name: 'app-category', params: { category: 'enabled' } }"
				:name="AppStoreSectionNames.enabled">
				<template #icon>
					<NcIconSvgWrapper :path="AppStoreCategoryIcons.enabled" />
				</template>
			</NcAppNavigationItem>
			<NcAppNavigationItem id="app-category-disabled"
				:to="{ name: 'app-category', params: { category: 'disabled' } }"
				:name="AppStoreSectionNames.disabled">
				<template #icon>
					<NcIconSvgWrapper :path="AppStoreCategoryIcons.disabled" />
				</template>
			</NcAppNavigationItem>
			<NcAppNavigationItem v-if="updateCount > 0"
				id="app-category-updates"
				:to="{ name: 'app-category', params: { category: 'updates' } }"
				:name="AppStoreSectionNames.updates">
				<template #counter>
					<NcCounterBubble>{{ updateCount }}</NcCounterBubble>
				</template>
				<template #icon>
					<NcIconSvgWrapper :path="AppStoreCategoryIcons.updates" />
				</template>
			</NcAppNavigationItem>
			<NcAppNavigationItem id="app-category-your-bundles"
				:to="{ name: 'app-category', params: { category: 'app-bundles' } }"
				:name="AppStoreSectionNames['app-bundles']">
				<template #icon>
					<NcIconSvgWrapper :path="AppStoreCategoryIcons.bundles" />
				</template>
			</NcAppNavigationItem>

			<NcAppNavigationSpacer />

			<!-- App store categories -->
			<li v-if="appstoreEnabled && categoriesLoading" class="categories--loading">
				<NcLoadingIcon :size="20" :aria-label="t('settings', 'Loading categories')" />
			</li>
			<template v-else-if="appstoreEnabled && !categoriesLoading">
				<NcAppNavigationItem v-if="isSubscribed"
					id="app-category-supported"
					:to="{ name: 'app-category', params: { category: 'supported' } }"
					:name="AppStoreSectionNames.supported">
					<template #icon>
						<NcIconSvgWrapper :path="AppStoreCategoryIcons.supported" />
					</template>
				</NcAppNavigationItem>
				<NcAppNavigationItem id="app-category-featured"
					:to="{ name: 'app-category', params: { category: 'featured' } }"
					:name="AppStoreSectionNames.featured">
					<template #icon>
						<NcIconSvgWrapper :path="AppStoreCategoryIcons.featured" />
					</template>
				</NcAppNavigationItem>

				<NcAppNavigationItem v-for="category in categories"
					:id="`app-category-${category.id}`"
					:key="category.id"
					:name="category.displayName"
					:to="{
						name: 'app-category',
						params: { category: category.id },
					}">
					<template #icon>
						<NcIconSvgWrapper :path="category.icon" />
					</template>
				</NcAppNavigationItem>
			</template>

			<NcAppNavigationItem id="app-developer-docs"
				:name="t('settings', 'Developer documentation ↗')"
				:href="developerDocsUrl" />
		</template>
	</NcAppNavigation>
</template>

<script setup lang="ts">
import { subscribe } from '@nextcloud/event-bus'
import { loadState } from '@nextcloud/initial-state'
import { translate as t } from '@nextcloud/l10n'
import { useIsSmallMobile } from '@nextcloud/vue/dist/Composables/useIsMobile.js'
import { computed, onBeforeMount } from 'vue'
import { useAppStore } from '../../store/appStore'
import { useAppStoreSearchStore } from '../../store/appStoreSearch'
import { AppStoreSectionNames } from '../../constants/AppStoreConstants'

import NcAppNavigation from '@nextcloud/vue/dist/Components/NcAppNavigation.js'
import NcAppNavigationItem from '@nextcloud/vue/dist/Components/NcAppNavigationItem.js'
import NcAppNavigationSearch from '@nextcloud/vue/dist/Components/NcAppNavigationSearch.js'
import NcAppNavigationSpacer from '@nextcloud/vue/dist/Components/NcAppNavigationSpacer.js'
import NcCounterBubble from '@nextcloud/vue/dist/Components/NcCounterBubble.js'
import NcIconSvgWrapper from '@nextcloud/vue/dist/Components/NcIconSvgWrapper.js'
import NcLoadingIcon from '@nextcloud/vue/dist/Components/NcLoadingIcon.js'
import AppStoreCategoryIcons from '../../constants/AppStoreCategoryIcons'

const updateCount = loadState<number>('settings', 'appstoreUpdateCount', 0)
const appstoreEnabled = loadState<boolean>('settings', 'appstoreEnabled', true)
const developerDocsUrl = loadState<string>('settings', 'appstoreDeveloperDocs', '')

const store = useAppStore()
const searchStore = useAppStoreSearchStore()
const categories = computed(() => store.categories)
const categoriesLoading = computed(() => store.loading.categories)

/**
 * Check if the current instance has a support subscription from the Nextcloud GmbH
 *
 * For customers of the Nextcloud GmbH the app level will be set to `300` for apps that are supported in their subscription
 */
const isSubscribed = computed(() => store.apps.find(({ level }) => level === 300) !== undefined)

const isSmallMobile = useIsSmallMobile()
// Subscribe to unified search to use the search input for small mobile
subscribe('nextcloud:unified-search:search', ({ query: text }) => {
	if (isSmallMobile.value) {
		searchStore.query = text
	}
})

// load categories when component is mounted
onBeforeMount(() => {
	store.loadApps()
})
</script>

<style scoped>
/* The categories-loading indicator */
.categories--loading {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>
