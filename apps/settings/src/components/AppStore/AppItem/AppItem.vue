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
			'app-item--with-sidebar': withSidebar,
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
			class="app-summary"
			:headers="getDataItemHeaders(`app-version`)">
			{{ app.summary }}
		</component>

		<component :is="dataItemTag"
			v-if="listView"
			class="app-version"
			:headers="getDataItemHeaders(`app-table-col-version`)">
			<span v-if="app.version">{{ app.version }}</span>
			<span v-else-if="app.appstoreData.releases[0].version">{{ app.appstoreData.releases[0].version }}</span>
		</component>

		<component :is="dataItemTag" :headers="getDataItemHeaders(`app-table-col-level`)" class="app-level">
			<AppLevelBadge :level="app.level" />
			<AppScore v-if="hasRating && !listView" :score="app.score" />
		</component>

		<AppItemActions v-if="!inline"
			v-show="!isSmallMobile"
			:app="app"
			:headers="getDataItemHeaders('app-table-col-actions')" />
	</component>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IAppstoreApp } from '../../../app-types'

import { useIsSmallMobile } from '@nextcloud/vue/dist/Composables/useIsMobile.js'
import { useRoute } from 'vue-router/composables'
import { computed } from 'vue'

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
		type: Object as PropType<IAppstoreApp>,
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

/**
 * The HTML tag to use.
 */
const dataItemTag = computed(() => props.listView ? 'td' : 'div')

/**
 * If the rating should be shown.
 * This is true if at least five rating were sent.
 */
const hasRating = computed(() => props.app.appstoreData?.ratingNumOverall > 5)

/**
 * Is the sidebar shown.
 * The sidebar is always shown if an app is selected.
 */
const withSidebar = computed(() => Boolean(route.params.id))

/**
 * Is this app is the currently selected app
 */
const isSelected = computed(() => route.params.id === props.app.id)

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
@use '../../../../../../core/css/variables.scss' as variables;
@use 'sass:math';

.app-item {
	position: relative;

	&:hover {
		background-color: var(--color-background-dark);
	}

	&--list-view {
		--app-item-padding: calc(var(--default-grid-baseline) * 2);
		--app-item-height: calc(var(--default-clickable-area) + var(--app-item-padding) * 2);

		&.app-item--selected {
			background-color: var(--color-background-dark);
		}

		> * {
			vertical-align: middle;
			border-bottom: 1px solid var(--color-border);
			padding: var(--app-item-padding);
			height: var(--app-item-height);
		}

		/* hide app version and level on narrower screens */
		@media only screen and (max-width: 900px) {
			.app-version,
			.app-level {
				display: none;
			}
		}
	}

	&--store-view {
		padding: 30px;

		@media only screen and (min-width: 1601px) {
			width: 25%;

			&.app-item--with-sidebar {
				width: 33%;
			}
		}

		@media only screen and (max-width: 1600px) {
			width: 25%;

			&.app-item--with-sidebar {
				width: 33%;
			}
		}

		@media only screen and (max-width: 1400px) {
			width: 33%;

			&.app-item--with-sidebar {
				width: 50%;
			}
		}

		@media only screen and (max-width: 900px) {
			width: 50%;

			&.app-item--with-sidebar {
				width: 100%;
			}
		}

		@media only screen and (max-width: variables.$breakpoint-mobile) {
			width: 50%;
		}

		@media only screen and (max-width: 480px) {
			width: 100%;
		}
	}
}

.app-version {
	color: var(--color-text-maxcontrast);
}
</style>
