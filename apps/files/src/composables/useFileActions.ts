/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { FileAction, Node, View } from '@nextcloud/files'
import type { MaybeRef } from '@vueuse/core'

import { NodeStatus, getFileActions } from '@nextcloud/files'
import { computed, unref } from 'vue'

export function useFileActions(node: MaybeRef<Node>, view: MaybeRef<View>) {
	const actions = getFileActions()

	const enabledActions = computed<FileAction[]>(() => {
		if (unref(node).status === NodeStatus.FAILED) {
			return []
		}

		return actions
			.filter((action: FileAction) => action.enabled === undefined || action.enabled([unref(node)], unref(view)))
			.sort((a: FileAction, b: FileAction) => (a.order || 0) - (b.order || 0))
	})

	const enabledDefaultActions = computed<FileAction[]>(() => {
		return enabledActions.value
			.filter((action: FileAction) => !!action.default)
	})

	const defaultAction = computed<FileAction | null>(() => enabledDefaultActions[0] ?? null)

	return {
		/**
		 * All registered actions
		 */
		actions,
		/**
		 * The default action to use on the current node and view
		 */
		defaultAction,
		/**
		 * All currently enabled actions for the current node and view
		 * This list is sorted by the action order
		 */
		enabledActions,
		/**
		 * All currently enabled default actions for the current node and view
		 * This list is sorted by the action order
		 */
		enabledDefaultActions,
	}
}
