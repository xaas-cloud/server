<!--
 - SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import type { IAppStoreApp } from '../../../constants/AppStoreTypes'

import { computed } from 'vue'
import { useRoute } from 'vue-router/composables'

const props = defineProps<{
	app: IAppStoreApp
	category: string
	listView: boolean
}>()

const route = useRoute()

/**
 * The HTML tag to use - depending on the list vs grid view
 */
const tag = computed(() => props.listView ? 'td' : 'div')
const to = computed(() => route.name === 'discover'
	? { name: 'discover', params: { appId: props.app.id } }
	: { name: 'app-details', params: { category: props.category, appId: props.app.id } },
)
</script>

<template>
	<component :is="tag" class="app-item-name">
		<router-link class="app-item-name__link" :to="to">
			{{ app.name }}
		</router-link>
	</component>
</template>

<style scoped lang="scss">
.app-item-name {
	font-weight: bold;
	margin: calc(2 * var(--default-grid-baseline)) 0;

	&__link::after {
		content: '';
		position: absolute;
		inset-block: 0;
		inset-inline: 0;
	}

	// The list view
	&--list-view {
		font-weight: normal;
		margin: 0;
		padding: 0 var(--app-item-padding);

		.app-item-name__link {
			height: var(--app-item-height);
			display: flex;
			align-items: center;

			// Note: because of Safari bug, we cannot position link overlay relative to the table row
			// So we need to manually position it relative to the table container and cell
			// See: https://bugs.webkit.org/show_bug.cgi?id=240961
			&::after {
				height: var(--app-item-height);
			}
		}
	}
}
</style>
