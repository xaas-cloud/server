/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useHotKey } from '@nextcloud/vue/dist/Composables/useHotKey.js'

import { action as deleteAction } from '../actions/deleteAction.ts'
import { action as renameAction } from '../actions/renameAction.ts'
import { action as favoriteAction } from '../actions/favoriteAction.ts'
import { action as sidebarAction } from '../actions/sidebarAction.ts'
import { executeAction } from '../utils/actionUtils.ts'
import logger from '../logger.ts'

export const registerHotkeys = function() {
	// d opens the sidebar
	useHotKey('d', () => executeAction(sidebarAction), {
		stop: true,
		prevent: true,
	})

	// F2 renames the file
	useHotKey('F2', () => executeAction(renameAction), {
		stop: true,
		prevent: true,
	})

	// s toggle favorite
	useHotKey('s', () => executeAction(favoriteAction), {
		stop: true,
		prevent: true,
	})

	// Delete deletes the file
	useHotKey('Delete', () => executeAction(deleteAction), {
		stop: true,
		prevent: true,
	})

	logger.debug('Hotkeys registered')
}
