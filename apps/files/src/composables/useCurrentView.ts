/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { View } from '@nextcloud/files'
import { getNavigation } from '@nextcloud/files'
import { onMounted, onUnmounted, readonly, shallowRef } from 'vue'

/**
 * Composable to get the current active view
 */
export function useCurrentView() {
	const navigation = getNavigation()
	const currentView = shallowRef<View>()

	const onUpdateView = ({ detail }) => { currentView.value = detail }

	onMounted(() => navigation.addEventListener('updateActive', onUpdateView))
	onUnmounted(() => navigation.removeEventListener('updateActive', onUpdateView))

	return {
		/**
		 * The currently active files view
		 */
		currentView: readonly(currentView),
	}
}
