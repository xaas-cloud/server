<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<component :is="listView ? 'tr' : (inline ? 'article' : 'li')"
		class="app-item"
		:class="{
			'app-item--list-view': listView,
			'app-item--store-view': !listView,
			'app-item--selected': isSelected,
		}">
		<AppItemIcon :app="app"
			:list-view="listView"
			:headers="getDataItemHeaders('app-table-col-icon')" />

		<AppItemName :app="app"
			:category="category"
			class="app-item__name"
			:list-view="listView"
			:headers="getDataItemHeaders('app-table-col-name')" />

		<component :is="dataItemTag"
			v-if="!listView"
			class="app-item__summary"
			:headers="getDataItemHeaders(`app-version`)">
			{{ app.summary }}
		</component>

		<component :is="dataItemTag"
			v-if="listView"
			v-show="!isSmallMobile"
			class="app-item__version"
			:headers="getDataItemHeaders(`app-table-col-version`)">
			<span v-if="app.version">{{ app.version }}</span>
			<span v-else-if="app.releases?.[0].version">{{ app?.releases[0].version }}</span>
		</component>

		<component
			:is="dataItemTag"
			v-show="!listView || !isSmallMobile"
			class="app-item__level"
			:headers="getDataItemHeaders(`app-table-col-level`)">
			<AppLevelBadge :level="app.level" />
			<AppScore v-if="appRating && !listView" :score="appRating" />
		</component>

		<AppItemActions v-if="!inline"
			:app="app"
			:data-item-tag="dataItemTag"
			:list-view="listView"
			:headers="getDataItemHeaders('app-table-col-actions')" />
	</component>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IAppStoreApp } from '../../../constants/AppStoreTypes'

import { useIsSmallMobile } from '@nextcloud/vue/dist/Composables/useIsMobile.js'
import { useRoute } from 'vue-router/composables'
import { computed, toRef } from 'vue'
import { useAppRating } from '../../../composables/useAppRating'

import AppItemActions from './AppItemActions.vue'
import AppItemIcon from './AppItemIcon.vue'
import AppItemName from './AppItemName.vue'
import AppScore from '../AppScore.vue'
import AppLevelBadge from '../AppLevelBadge.vue'

const props = defineProps({
	/**
	 * The app to show
	 */
	app: {
		type: Object as PropType<IAppStoreApp>,
		required: true,
	},

	/**
	 * The category the app is shown in
	 */
	category: {
		type: String,
		required: true,
	},

	/**
	 * If list view is used (table vs grid)
	 */
	listView: {
		type: Boolean,
		default: false,
	},

	/**
	 * If this app is shown as part of a bundle
	 */
	useBundleView: {
		type: Boolean,
		default: false,
	},

	/**
	 * Headers table cell -> table header mapping to be set on every cell
	 */
	headers: {
		type: String,
		default: null,
	},

	/**
	 * To render the app item as inline content without any wrapper list / grid.
	 * E.g. for the app discover section.
	 */
	inline: {
		type: Boolean,
		default: false,
	},
})

const route = useRoute()
const isSmallMobile = useIsSmallMobile()
const appRating = useAppRating(toRef(props, 'app'))

/**
 * The HTML tag to use.
 */
const dataItemTag = computed(() => props.listView ? 'td' : 'div')

/**
 * Is this app is the currently selected app
 */
const isSelected = computed(() => route.params.appId === props.app.id)

/**
 * Set table header association to a table cell.
 * If the list view is not used this returns `undefined`.
 *
 * @param columnName The column name
 */
function getDataItemHeaders(columnName: string) {
	return props.useBundleView ? [props.headers, columnName].join(' ') : undefined
}
</script>

<style scoped lang="scss">
.app-item {
	box-sizing: border-box;
	position: relative;

	&:hover {
		background-color: var(--color-background-dark);
	}

	&--list-view {
		&.app-item--selected {
			background-color: var(--color-background-dark);
		}

		> * {
			vertical-align: middle;
			border-bottom: 1px solid var(--color-border);
			padding: var(--app-item-padding);
			height: var(--app-item-height);
		}
	}

	&--store-view {
		border-radius: var(--border-radius-container);
		padding: calc(3 * var(--default-grid-baseline));
		display: flex;
		flex-direction: column;

		&.app-item--selected {
			outline: 2px solid var(--color-main-text);
		}
	}
}

.app-item__version {
	color: var(--color-text-maxcontrast);
}
</style>
