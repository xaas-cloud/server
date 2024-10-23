<!--
 - SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import type { IAppStoreApp } from '../../../constants/AppStoreTypes.ts'
import { computed, ref, watchEffect } from 'vue'
import IconSettings from 'vue-material-design-icons/Cog.vue'

import { preloadImage } from '../../../service/imagePreloading.ts'
import logger from '../../../logger.ts';

const props = defineProps<{
	app: IAppStoreApp
	listView?: boolean
}>()

/**
 * The preview URL to use.
 * For list view we always force the preview (e.g. the app icon), for grid view we prefer the screenshot but fallback to preview.
 */
const previewUrl = computed(() => props.listView ? props.app.preview : (props.app.screenshot ?? props.app.preview))

/**
 * Is the shown image an icon.
 * This is the case if `previewAsIcon` is set
 *   AND either we are in list view where the preview is shown
 *   OR no screenshot is available and we fallback to the preview.
 */
const isPreviewIcon = computed(() => props.app.previewAsIcon && (props.listView || !props.app.screenshot))

/**
 * True if a preview is available.
 * For list view we use the preview (which is the icon), for grid view we use the screenshot.
 */
const hasPreview = computed(() => Boolean(previewUrl.value))

/**
 * Preload the preview until it is loaded show the placeholder
 */
const previewLoaded = ref(false)
watchEffect(() => {
	previewLoaded.value = false
	if (hasPreview.value) {
		preloadImage(previewUrl.value!)
			.then(() => { previewLoaded.value = true })
			.catch((error) => logger.debug(`Failed to load screenshot for ${props.app.name}`, { error }))
	}
})

/**
 * The HTML tag to use - depending on the list vs grid view
 */
const tag = computed(() => props.listView ? 'td' : 'div')
</script>

<template>
	<component :is="tag" class="app-item-icon" :class="{ 'app-item-icon--grid': !listView }">
		<IconSettings v-if="!hasPreview || !previewLoaded"
			class="app-item-icon__fallback"
			:size="listView ? 20 : 64" />
		<img v-else
			alt=""
			class="app-item-icon__image"
			:class="{ 'app-item-icon__image--is-icon': isPreviewIcon }"
			:src="previewUrl">
	</component>
</template>

<style scoped lang="scss">
.app-item-icon {
	--app-icon-size: 20px;

	height: var(--app-icon-size);
	width: var(--default-clickable-area);
	position: relative;
	overflow: hidden;

	.app-item-icon__fallback {
		color: var(--color-text-maxcontrast);
	}

	.app-item-icon__image {
		height: var(--app-icon-size);
		width: var(--app-icon-size);

		&--is-icon {
			// if an icon is shown we need to adjust the color if needed
			filter: var(--background-invert-if-bright);
			opacity: 0.6;
		}
	}

	&--grid {
		--app-icon-size: 150px;
		width: auto;

		.app-item-icon__image,
		.app-item-icon__fallback {
			height: var(--app-icon-size);
			width: 100%;
			object-fit: cover;
		}
	}
}
</style>
