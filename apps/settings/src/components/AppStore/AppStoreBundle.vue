<script setup lang="ts">
import type { IAppStoreApp } from '../../constants/AppStoreTypes'

import { showError, showSuccess } from '@nextcloud/dialogs'
import { t } from '@nextcloud/l10n'
import { computed } from 'vue'
import { useAppStore } from '../../store/appStore'
import { AppStoreSearchResultsCategory } from '../../constants/AppStoreConstants'
import { useAppStoreSearchStore } from '../../store/appStoreSearch'
import { useCurrentCategory } from '../../composables/useCurrentCategory'
import { disableApps, enableApps } from '../../service/AppStoreApi'
import logger from '../../logger'
import AppItem from './AppItem/AppItem.vue'
import NcButton from '@nextcloud/vue/dist/Components/NcButton.js'

// with Vue 3 we can use IAppStoreBundle type to define props
const props = defineProps({
	id: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	isCategory: {
		type: Boolean,
		default: false,
	},
	showHeading: {
		type: Boolean,
		default: false,
	},
})

const store = useAppStore()
const searchStore = useAppStoreSearchStore()
const { currentCategory } = useCurrentCategory()

/**
 * All apps that are part of this bundle
 */
const bundleApps = computed(() => {
	if (props.id === AppStoreSearchResultsCategory) {
		// if we show the search results only show the external results not the ones from the current category
		return searchStore.searchResults
			.filter((app) => app.category !== currentCategory.value && !app.category.includes(currentCategory.value))
	}

	let apps = [] as IAppStoreApp[]
	if (props.isCategory) {
		apps = store.getAppsByCategory(currentCategory.value)
	} else {
		apps = store.getAppsByBundle(props.id)
	}

	// filter current bundle if needed
	if (searchStore.query !== '') {
		return apps.filter(searchStore.filterAppsByQuery)
	}
	return apps.sort((a, b) => a.name.localeCompare(b.name))
})

/** True if all apps of this bundle have been enabled */
const allAppsEnabled = computed(() => bundleApps.value.every((app) => app.active))

/**
 * Toggle all apps of this bundle.
 *   If *all* apps are installed and enabled -> Disable all
 *   Otherwise install and enable all missing apps
 */
async function toggleBundle() {
	try {
		if (allAppsEnabled.value) {
			await disableApps(bundleApps.value.map((app) => app.id))
			showSuccess(t('settings', 'All apps of {bundle} were disabled.', { bundle: props.name }))
		} else {
			// Get all ids of apps that are not enabled currently
			const appIds = bundleApps.value
				.filter((app) => !app.active)
				.map((app) => app.id)
			await enableApps(appIds)
			showSuccess(t('settings', 'All apps of {bundle} were installed.', { bundle: props.name }))
		}
	} catch (error) {
		logger.error('Could not enable all apps of bundle.', { bundle: props.id, error })
		showError(t('settings', 'Installing {bundle} failed', { bundle: props.name }))
	}
}
</script>
<template>
	<TransitionGroup v-if="bundleApps.length > 0"
		class="app-store-bundle"
		name="app-store-bundle"
		tag="tbody">
		<tr v-if="showHeading" :key="`${id}--header`">
			<th :id="`app-table-rowgroup-${id}`"
				class="app-store-bundle__header"
				colspan="5"
				scope="rowgroup">
				<div class="app-store-bundle__header-wrapper">
					<span class="app-store-bundle__header-text">
						{{ name }}
					</span>
					<NcButton v-if="!isCategory"
						type="primary"
						@click="toggleBundle">
						{{ allAppsEnabled ? t('settings', 'Disable all') : t('settings', 'Download and enable all') }}
					</NcButton>
				</div>
			</th>
		</tr>
		<AppItem v-for="app in bundleApps"
			:key="`${id}-${app.id}`"
			:app="app"
			:category="currentCategory"
			:headers="showHeading ? `app-table-rowgroup-${id}` : undefined"
			list-view />
	</TransitionGroup>
</template>

<style scoped lang="scss">
.app-store-bundle {
	&__header {
		height: var(--app-item-height);

		&:hover {
			background-color: var(--color-main-background);
		}
	}

	&__header-wrapper {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		// align with icons
		padding-inline-start: calc((var(--default-clickable-area) - 20px) / 2);
	}

	&__header-text {
		font-size: 1.6em;
	}

	// Add some spacing before any additional bundle
	&:not(:first-of-type) &__header {
		height: calc(2 * var(--app-item-height)) !important;
		vertical-align: bottom;

		.app-store-bundle__header-wrapper {
			padding-bottom: calc(2 * var(--default-grid-baseline));
		}
	}
}
</style>
