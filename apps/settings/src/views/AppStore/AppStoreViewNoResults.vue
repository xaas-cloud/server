<!--
  - SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { t } from '@nextcloud/l10n'
import { useAppStoreSearchStore } from '../../store/appStoreSearch'
import NcButton from '@nextcloud/vue/dist/Components/NcButton.js'
import NcEmptyContent from '@nextcloud/vue/dist/Components/NcEmptyContent.js'
import IconMagnify from 'vue-material-design-icons/Magnify.vue'

const searchStore = useAppStoreSearchStore()

/**
 * Clear the search query to reset the search
 */
function clearSearch() {
	searchStore.query = ''
}
</script>

<template>
	<NcEmptyContent class="app-store-no-results"
		:name="t('settings', 'No search results')">
		<template #icon>
			<IconMagnify :size="64" />
		</template>
		<template #action>
			<NcButton @click="clearSearch">
				{{ t('settings', 'Clear search') }}
			</NcButton>
		</template>
	</NcEmptyContent>
</template>

<style scoped>
.app-store-no-results {
	height: 100%;
}
</style>
