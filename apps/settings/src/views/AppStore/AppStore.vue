<!--
  - SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<!-- Apps list -->
	<NcAppContent :page-heading="appStoreLabel">
		<h2 class="app-store__label" v-text="viewLabel" />
		<router-view />
	</NcAppContent>
</template>

<script setup lang="ts">
import { t } from '@nextcloud/l10n'
import { computed, onBeforeMount, watchEffect } from 'vue'
import { useRoute } from 'vue-router/composables'

import { useAppStore } from '../../store/appStore'
import { AppStoreSectionNames } from '../../constants/AppStoreConstants'

import NcAppContent from '@nextcloud/vue/dist/Components/NcAppContent.js'

const route = useRoute()
const store = useAppStore()

/**
 * ID of the current active category
 */
const currentCategory = computed(() => route.params?.category ?? route.name!)

const appStoreLabel = t('settings', 'App Store')
const viewLabel = computed(() => AppStoreSectionNames[currentCategory.value]
		?? store.getCategoryById(currentCategory.value)?.displayName
		?? appStoreLabel,
)

// Update the window title based on the current category
watchEffect(() => {
	window.document.title = `${viewLabel.value} - ${appStoreLabel} - Nextcloud`
})
// Load apps as both discover and normal app view require them to be loaded
onBeforeMount(() => store.loadApps())
onBeforeMount(() => store.loadCategories())
</script>

<style scoped>
.app-store__label {
	margin-block-start: var(--app-navigation-padding);
	margin-inline-start: calc(var(--default-clickable-area) + var(--app-navigation-padding) * 2);
	min-height: var(--default-clickable-area);
	line-height: var(--default-clickable-area);
	font-size: calc(var(--default-clickable-area) / 1.5);
}
</style>
