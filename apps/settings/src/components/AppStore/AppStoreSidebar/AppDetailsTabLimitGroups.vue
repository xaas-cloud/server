<script setup lang="ts">
import type { OCSResponse } from '@nextcloud/typings/ocs'
import type { IAppStoreApp } from '../../../constants/AppStoreTypes'

import axios from '@nextcloud/axios'
import { t } from '@nextcloud/l10n'
import { generateOcsUrl } from '@nextcloud/router'
import { useElementVisibility, useThrottleFn } from '@vueuse/core'
import { computed, ref, watchEffect } from 'vue'
import { AlwaysEnabledAppTypes } from '../../../constants/AppStoreConstants'
import { useAppStore } from '../../../store/appStore'
import { useAppManagement } from '../../../composables/useAppManagement'
import NcCheckboxRadioSwitch from '@nextcloud/vue/dist/Components/NcCheckboxRadioSwitch.js'
import NcSelect from '@nextcloud/vue/dist/Components/NcSelect.js'

const props = defineProps<{app: IAppStoreApp}>()
const store = useAppStore()
const { enableApp } = useAppManagement()

/** Check that the current app can be limited to groups. For some app types this is not possible. */
const canLimitToGroups = computed(() => props.app.types.every((type) => !AlwaysEnabledAppTypes.includes(type)))
/** Frontend only property to track if the group-select should be shown */
const limitAppToGroups = ref(false)

// This is used to track the scroll state of the select
// to query a new bunch of groups
const loadMoreElement = ref<HTMLLIElement>()
const loadMore = useElementVisibility(loadMoreElement)
watchEffect(() => {
	if (loadMoreElement.value && loadMore.value) {
		fetchGroups()
	}
})

/** Search query on the group select */
const searchQuery = ref('')
/** Limit of groups to fetch in one query */
const limit = 10
/** All loaded groups */
const groups = ref<string[]>([])
/** Current offset of querying groups (reset on search-query changes) */
const offset = ref(0)
/** If more groups can be fetched for the current search query */
const hasMore = ref(true)

/**
 * Load a new chunk of groups from the API
 * @todo This should be moved to an API package
 */
async function fetchGroups() {
	if (hasMore.value === false) {
		return
	}

	const url = generateOcsUrl(
		`cloud/groups?offset={offset}&limit=${limit}${searchQuery.value ? '&search={search}' : ''}`,
		{
			offset,
			search: searchQuery.value,
		},
	)
	const { data } = await axios.get<OCSResponse<{ groups: string[] }>>(url)
	const loadedGroups = data.ocs.data.groups
	offset.value += loadedGroups.length
	hasMore.value = loadedGroups.length >= limit
	// Add all *new* groups to the list
	groups.value.push(...loadedGroups.filter((group) => !groups.value.includes(group)))
}

/**
 * Callback function for NcSelect.search
 * @param search Query string for the group
 * @param loading Loading callback
 */
async function handleSearch(search, loading: (l: boolean) => void) {
	loading(true)
	searchQuery.value = search
	offset.value = 0
	hasMore.value = true
	await fetchGroups()
	loading(false)
}
/** Debounced (throttled) search callback when user enters a group name only one request every 500ms is sent */
const onSearch = useThrottleFn(handleSearch, 500)

/**
 * Save the updated groups on the store
 * @param groups The new groups this app is limited to
 */
async function updateGroups(groups: string[]) {
	store.updateApp(props.app, { groups })
	await enableApp(props.app)
}
</script>

<template>
	<div v-if="canLimitToGroups" class="app-details-tab-limit-groups">
		<NcCheckboxRadioSwitch :checked.sync="limitAppToGroups" class="app-details-tab-limit-groups__checkbox">
			{{ t('settings', 'Limit to groups') }}
		</NcCheckboxRadioSwitch>

		<NcSelect v-if="limitAppToGroups"
			:options="groups"
			:value="app.groups"
			label="name"
			:input-label="t('settings', 'Limit app usage to groups')"
			multiple
			@search="onSearch"
			@input="updateGroups">
			<template #list-footer>
				<li v-if="hasMore" ref="loadMoreElement" class="load-more">
					{{ t('settings', 'Loading more …') }}
				</li>
			</template>
			<template #no-result>
				{{ t('settings', 'No results') }}
			</template>
		</NcSelect>
	</div>
</template>

<style scoped>
.app-details-tab-limit-groups__checkbox {
	margin-block-end: calc(2 * var(--default-grid-baseline));
}
</style>
