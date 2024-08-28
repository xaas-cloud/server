/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { subscribe } from '@nextcloud/event-bus'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router/composables'

export const useAccountSearchStore = defineStore('account-search', () => {
	const query = ref('')

	const hasQuery = computed(() => query.value.trim() !== '')

	// reset on navigation
	const route = useRoute()
	watch(() => route.params?.selectedGroup, () => {
		query.value = ''
	})

	// Connect with unified search
	subscribe('nextcloud:unified-search:search', (event) => { query.value = event.query })
	subscribe('nextcloud:unified-search:reset', () => { query.value = '' })

	return {
		hasQuery,
		query,
	}
})
