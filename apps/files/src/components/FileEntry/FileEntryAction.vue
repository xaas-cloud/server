<!--
  - SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<NcActionButton :ref="buttonRef"
		class="files-list__row-action"
		:class="buttonClasses"
		:close-after-click="variant !== 'menu'"
		:data-cy-files-list-row-action="action.id"
		:is-menu="variant === 'menu'"
		:aria-label="actionTitle"
		:title="actionTitle"
		@click="onActionClick">
		<template #icon>
			<NcLoadingIcon v-if="isLoading" size="18" />
			<NcIconSvgWrapper v-else
				class="files-list__row-action-icon"
				:svg="action.iconSvgInline([source], currentView)" />
		</template>
		{{ displayName }}
	</NcActionButton>
</template>

<script lang="ts">
import type { PropType } from 'vue'
import type { FileAction, Node } from '@nextcloud/files'

import { defineComponent } from 'vue'

import NcActionButton from '@nextcloud/vue/components/NcActionButton'
import NcIconSvgWrapper from '@nextcloud/vue/components/NcIconSvgWrapper'
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon'

import { useFileListWidth } from '../../composables/useFileListWidth.ts'
import { useNavigation } from '../../composables/useNavigation.ts'
import logger from '../../logger.ts'

export default defineComponent({
	name: 'FileEntryAction',

	components: {
		NcActionButton,
		NcIconSvgWrapper,
		NcLoadingIcon,
	},

	props: {
		action: {
			type: Object as PropType<FileAction>,
			required: true,
		},
		source: {
			type: Object as PropType<Node>,
			required: true,
		},
		isLoading: {
			type: Boolean,
			default: false,
		},
		isMenu: {
			type: Boolean,
			default: false,
		},
		gridMode: {
			type: Boolean,
			default: false,
		},
		variant: {
			type: String as PropType<'inline'|'menu'|'submenu'>,
			default: undefined,
		},
	},

	emits: ['click'],

	setup() {
		// The file list is guaranteed to be only shown with active view - thus we can set the `loaded` flag
		const { currentView } = useNavigation(true)
		const filesListWidth = useFileListWidth()

		return {
			currentView,
			filesListWidth,
		}
	},

	computed: {
		buttonRef() {
			return `action-${this.action.id}`
		},

		buttonClasses() {
			const classes = {
				[`files-list__row-action-${this.action.id}`]: true,
			}

			switch (this.variant) {
			case 'inline':
				classes['files-list__row-action--inline'] = true
				break
			case 'submenu':
				classes['files-list__row-action--submenu'] = true
				break
			case 'menu':
				classes['files-list__row-action--menu'] = true
				break
			}

			return classes
		},

		actionTitle() {
			try {
				return this.action.title?.([this.source], this.currentView)
			} catch (error) {
				logger.error('Error while getting action title', { action: this.action, error })
				return this.action.id
			}
		},

		displayName() {
			try {
				if ((this.gridMode || (this.filesListWidth < 768 && this.action.inline)) && typeof this.action.title === 'function') {
					// if an inline action is rendered in the menu for
					// lack of space we use the title first if defined
					const title = this.action.title([this.source], this.currentView)
					if (title) return title
				}
				return this.action.displayName([this.source], this.currentView)
			} catch (error) {
				logger.error('Error while getting action display name', { action: this.action, error })
				// Not ideal, but better than nothing
				return this.action.id
			}
		},
	},

	methods: {
		onActionClick() {
			this.$emit('click', this.action)
		},
	},
})
</script>

<style scoped lang="scss">
.files-list__row-action {
	--max-icon-size: calc(var(--default-clickable-area) - 2 * var(--default-grid-baseline));

	// inline icons can have clickable area size so they still fit into the row
	&.files-list__row-action--inline {
		--max-icon-size: var(--default-clickable-area);
	}
	// destructive actions should be highlighted in red
	&.files-list__row-action--destructive {
		::deep(button) {
			color: var(--color-error) !important;
		}
	}

	// Some icons exceed the default size so we need to enforce a max width and height
	.files-list__row-action-icon :deep(svg) {
		max-height: var(--max-icon-size) !important;
		max-width: var(--max-icon-size) !important;
	}
}
</style>
