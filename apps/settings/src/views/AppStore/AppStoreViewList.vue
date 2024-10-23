<script setup lang="ts">
import type { IAppStoreBundle } from '../../constants/AppStoreTypes'

import { loadState } from '@nextcloud/initial-state'
import { n, t } from '@nextcloud/l10n'
import { computed } from 'vue'
import { useRoute } from 'vue-router/composables'
import { useAppStore } from '../../store/appStore'
import { useCurrentCategory } from '../../composables/useCurrentCategory'
import { useAppStoreSearchStore } from '../../store/appStoreSearch'
import { AppStoreSearchResultsCategory } from '../../constants/AppStoreConstants'
import { useAppManagement } from '../../composables/useAppManagement'
import AppStoreBundle from '../../components/AppStore/AppStoreBundle.vue'
import NcButton from '@nextcloud/vue/dist/Components/NcButton.js'
import NcNoteCard from '@nextcloud/vue/dist/Components/NcNoteCard.js'

const appstoreBundles = loadState<IAppStoreBundle[]>('settings', 'appstoreBundles', [])

const route = useRoute()
const store = useAppStore()
const searchStore = useAppStoreSearchStore()
const { updateApp } = useAppManagement()
const {
	currentCategory,
	currentCategoryName,
} = useCurrentCategory()

const isBundleView = computed(() => route.params.category === 'app-bundles')
/**
 * If we are not in the bundle view we just fake one bundle containing all apps.
 * Also if there are search results from other categories, we show it as a different bundle.
 */
const bundles = computed(() => {
	const appBundles: IAppStoreBundle[] = isBundleView.value
		? appstoreBundles
		: [{ id: currentCategory.value, name: currentCategoryName.value, isCategory: true }]
	if (searchStore) {
		appBundles.push({
			id: AppStoreSearchResultsCategory,
			name: t('settings', 'Results from other categories'),
		})
	}
	return appBundles
})

/**
 * True if the update notification should be shown (only when not in bundle or search view)
 */
const showUpdateNotification = computed(() => !isBundleView.value && searchStore.query === '')
/**
 * List of apps in the current view with updates available.
 */
const updatesAvailable = computed(() => showUpdateNotification.value
	? store.getAppsByCategory(currentCategory.value).filter((app) => app.update)
	: [],
)

/**
 * Update all apps that need an update
 */
async function updateAll() {
	for (const app of updatesAvailable.value) {
		await updateApp(app)
	}
}
</script>

<template>
	<div class="app-store-view-list">
		<!-- Show the update notification if it makes sense for the current view-->
		<template v-if="showUpdateNotification">
			<NcNoteCard v-if="updatesAvailable.length === 0"
				:text="t('settings', 'All apps are up-to-date.')"
				type="info" />
			<NcNoteCard v-else type="info">
				<div class="app-store-view-list__update-notification">
					<span>
						{{ n('settings', '%n app has an update available', '%n apps have an update available', updatesAvailable.length) }}
					</span>
					<NcButton class="app-store-view-list__update-notification-button"
						type="primary"
						@click="updateAll">
						{{ n('settings', 'Update', 'Update all', updatesAvailable.length) }}
					</NcButton>
				</div>
			</NcNoteCard>
		</template>

		<table class="app-store-view-list__table">
			<tr key="app-list-view-header">
				<th id="app-table-col-icon">
					<span class="hidden-visually">{{ t('settings', 'Icon') }}</span>
				</th>
				<th id="app-table-col-name">
					<span class="hidden-visually">{{ t('settings', 'Name') }}</span>
				</th>
				<th id="app-table-col-version">
					<span class="hidden-visually">{{ t('settings', 'Version') }}</span>
				</th>
				<th id="app-table-col-level">
					<span class="hidden-visually">{{ t('settings', 'Level') }}</span>
				</th>
				<th id="app-table-col-actions">
					<span class="hidden-visually">{{ t('settings', 'Actions') }}</span>
				</th>
			</tr>
			<AppStoreBundle v-for="bundle, index in bundles"
				v-bind="bundle"
				:key="bundle.id"
				:show-heading="bundles.length > 2 || index > 0" />
		</table>
	</div>
</template>

<style scoped lang="scss">
.app-store-view-list {
	--app-item-padding: calc(var(--default-grid-baseline) * 2);
	--app-item-height: calc(var(--default-clickable-area) + var(--app-item-padding) * 2);

	padding-inline: var(--app-navigation-padding);

	&__table {
		width: 100%;
	}

	&__update-notification {
		align-items: center;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		width: 100%;

		&-button {
			margin-inline-start: 2em;
		}
	}
}
</style>
