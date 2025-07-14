<!--
  - SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<td class="files-list__row-actions"
		data-cy-files-list-row-actions>
		<!-- Render actions -->
		<CustomElementRender v-for="action in enabledRenderActions"
			:key="action.id"
			:class="'files-list__row-action-' + action.id"
			:current-view="currentView"
			:render="action.renderInline"
			:source="source"
			class="files-list__row-action--inline" />

		<!-- Menu actions -->
		<NcActions ref="actionsMenu"
			:boundaries-element="getBoundariesElement"
			:container="getBoundariesElement"
			:force-name="true"
			type="tertiary"
			:force-menu="enabledInlineActions.length === 0 /* forceMenu only if no inline actions */"
			:inline="enabledInlineActions.length"
			:open="openedMenu"
			@close="onMenuClose"
			@closed="onMenuClosed">
			<!-- Default actions list-->
			<FileEntryAction v-for="(action, index) in renderedNonDestructiveActions"
				:key="action.id"
				:action="action"
				:grid-mode="gridMode"
				:is-loading="isLoadingAction(action)"
				:is-menu="isValidMenu(action)"
				:source="source"
				:variant="(index < enabledInlineActions.length) ? 'inline' : undefined"
				@click="onActionClick(action)" />

			<template v-if="renderedDestructiveActions.length">
				<NcActionSeparator />

				<!-- Destructive actions list-->
				<FileEntryAction v-for="action in renderedDestructiveActions"
					:key="action.id"
					:action="action"
					:grid-mode="gridMode"
					:is-loading="isLoadingAction(action)"
					:source="source"
					:variant="undefined /* inline already rendered above */"
					@click="onActionClick(action)" />
			</template>

			<!-- Submenu actions list-->
			<template v-if="openedSubmenu && enabledSubmenuActions[openedSubmenu?.id]">
				<!-- Back to top-level button -->
				<NcActionButton class="files-list__row-action-back" data-cy-files-list-row-action="menu-back" @click="onBackToMenuClick(openedSubmenu)">
					<template #icon>
						<ArrowLeftIcon />
					</template>
					{{ t('files', 'Back') }}
				</NcActionButton>
				<NcActionSeparator />

				<!-- Submenu actions -->
				<FileEntryAction v-for="action in enabledSubmenuActions[openedSubmenu?.id]"
					:key="action.id"
					:action="action"
					:grid-mode="gridMode"
					:is-loading="isLoadingAction(action)"
					:source="source"
					variant="submenu"
					@click="onActionClick(action)" />
			</template>
		</NcActions>
	</td>
</template>

<script lang="ts">
import type { PropType } from 'vue'
import type { FileAction, Node } from '@nextcloud/files'

import { DefaultType } from '@nextcloud/files'
import { defineComponent, inject } from 'vue'
import { t } from '@nextcloud/l10n'
import { useHotKey } from '@nextcloud/vue/composables/useHotKey'

import ArrowLeftIcon from 'vue-material-design-icons/ArrowLeft.vue'
import CustomElementRender from '../CustomElementRender.vue'
import FileEntryAction from './FileEntryAction.vue'
import NcActionButton from '@nextcloud/vue/components/NcActionButton'
import NcActions from '@nextcloud/vue/components/NcActions'
import NcActionSeparator from '@nextcloud/vue/components/NcActionSeparator'

import { executeAction } from '../../utils/actionUtils.ts'
import { useActiveStore } from '../../store/active.ts'
import { useFileListWidth } from '../../composables/useFileListWidth.ts'
import { useNavigation } from '../../composables/useNavigation'
import { useRouteParameters } from '../../composables/useRouteParameters.ts'
import actionsMixins from '../../mixins/actionsMixin.ts'
import logger from '../../logger.ts'

export default defineComponent({
	name: 'FileEntryActions',

	components: {
		ArrowLeftIcon,
		CustomElementRender,
		FileEntryAction,
		NcActionButton,
		NcActions,
		NcActionSeparator,
	},

	mixins: [actionsMixins],

	props: {
		opened: {
			type: Boolean,
			default: false,
		},
		source: {
			type: Object as PropType<Node>,
			required: true,
		},
		gridMode: {
			type: Boolean,
			default: false,
		},
	},

	setup() {
		// The file list is guaranteed to be only shown with active view - thus we can set the `loaded` flag
		const { currentView } = useNavigation(true)
		const { directory: currentDir } = useRouteParameters()

		const activeStore = useActiveStore()
		const filesListWidth = useFileListWidth()
		const enabledFileActions = inject<FileAction[]>('enabledFileActions', [])
		return {
			activeStore,
			currentDir,
			currentView,
			enabledFileActions,
			filesListWidth,
			t,
			// Allow nested components to be detected as valid NcActionButton
			// https://github.com/nextcloud-libraries/nextcloud-vue/blob/a498a5df4f8abbcf3e9ef1f581f379098b4ede6d/src/components/NcActions/NcActions.vue#L1260-L1279
			type: { name: NcActionButton },
		}
	},

	computed: {
		isActive() {
			return this.activeStore?.activeNode?.source === this.source.source
		},

		// Enabled action that are displayed inline
		enabledInlineActions() {
			if (this.filesListWidth < 768 || this.gridMode) {
				return []
			}
			return this.enabledFileActions.filter(action => {
				try {
					return action?.inline?.(this.source, this.currentView)
				} catch (error) {
					logger.error('Error while checking if action is inline', { action, error })
					return false
				}
			})
		},

		// Enabled action that are displayed inline with a custom render function
		enabledRenderActions() {
			if (this.gridMode) {
				return []
			}
			return this.enabledFileActions.filter(action => typeof action.renderInline === 'function')
		},

		// Actions shown in the menu
		enabledMenuActions() {
			// If we're in a submenu, only render the inline
			// actions before the filtered submenu
			if (this.openedSubmenu) {
				return this.enabledInlineActions
			}

			const actions = [
				// Showing inline first for the NcActions inline prop
				...this.enabledInlineActions,
				// Then the rest
				...this.enabledFileActions.filter(action => action.default !== DefaultType.HIDDEN && typeof action.renderInline !== 'function'),
			].filter((value, index, self) => {
				// Then we filter duplicates to prevent inline actions to be shown twice
				return index === self.findIndex(action => action.id === value.id)
			})

			// Generate list of all top-level actions ids
			const topActionsIds = actions.filter(action => !action.parent).map(action => action.id) as string[]

			// Filter actions that are not top-level AND have a valid parent
			return actions.filter(action => !(action.parent && topActionsIds.includes(action.parent)))
		},

		renderedNonDestructiveActions() {
			return this.enabledMenuActions.filter(action => !action.destructive)
		},

		renderedDestructiveActions() {
			return this.enabledMenuActions.filter(action => action.destructive)
		},

		openedMenu: {
			get() {
				return this.opened
			},
			set(value) {
				this.$emit('update:opened', value)
			},
		},

		/**
		 * Making this a function in case the files-list
		 * reference changes in the future. That way we're
		 * sure there is one at the time we call it.
		 */
		getBoundariesElement() {
			return document.querySelector('.app-content > .files-list')
		},
	},

	watch: {
		// Close any submenu when the menu state changes
		openedMenu() {
			this.openedSubmenu = null
		},
	},

	created() {
		useHotKey('Escape', this.onKeyDown, {
			stop: true,
			prevent: true,
		})

		useHotKey('a', this.onKeyDown, {
			stop: true,
			prevent: true,
		})
	},

	methods: {
		isLoadingAction(action: FileAction) {
			if (!this.isActive) {
				return false
			}
			return this.activeStore?.activeAction?.id === action.id
		},

		async onActionClick(action) {
			// If the action is a submenu, we open it
			if (this.enabledSubmenuActions[action.id]) {
				this.openedSubmenu = action
				return
			}

			// Make sure we set the node as active
			this.activeStore.activeNode = this.source

			// Execute the action
			await executeAction(action)
		},

		onKeyDown(event: KeyboardEvent) {
			// Don't react to the event if the file row is not active
			if (!this.isActive) {
				return
			}

			// ESC close the action menu if opened
			if (event.key === 'Escape' && this.openedMenu) {
				this.openedMenu = false
			}

			// a open the action menu
			if (event.key === 'a' && !this.openedMenu) {
				this.openedMenu = true
			}
		},

		onMenuClose() {
			// We reset the submenu state when the menu is closing
			this.openedSubmenu = null
		},

		onMenuClosed() {
			// We reset the actions menu state when the menu is finally closed
			this.openedMenu = false
		},
	},
})
</script>

<style lang="scss">
// Allow right click to define the position of the menu
// only if defined
main.app-content[style*="mouse-pos-x"] .v-popper__popper {
	transform: translate3d(var(--mouse-pos-x), var(--mouse-pos-y), 0px) !important;

	// If the menu is too close to the bottom, we move it up
	&[data-popper-placement="top"] {
		// 34px added to align with the top of the cursor
		transform: translate3d(var(--mouse-pos-x), calc(var(--mouse-pos-y) - 50vh + 34px), 0px) !important;
	}
	// Hide arrow if floating
	.v-popper__arrow-container {
		display: none;
	}
}
</style>

<style scoped lang="scss">
.files-list__row-action {
	--max-icon-size: calc(var(--default-clickable-area) - 2 * var(--default-grid-baseline));
}
</style>
