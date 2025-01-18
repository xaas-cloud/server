<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { decode } from 'blurhash'
import { onMounted, ref, watch } from 'vue'
import logger from '../../logger'

const props = defineProps<{
	hash: string,
}>()

const canvas = ref<HTMLCanvasElement>()

// Draw initial version on mounted
onMounted(drawBlurHash)

// On resize we redraw the BlurHash
useResizeObserver(canvas, drawBlurHash)

// Redraw when hash has changed
watch(() => props.hash, drawBlurHash)

/**
 * Render the BlurHash within the canvas
 */
function drawBlurHash() {
	if (canvas.value === undefined) {
		// Should never happen but better safe than sorry
		logger.error('BlurHash canvas not available')
		return
	}

	const { height, width } = canvas.value
	const pixels = decode(props.hash, width, height)

	const ctx = canvas.value.getContext('2d')
	if (ctx === null) {
		logger.error('Cannot create context for BlurHash canvas')
		return
	}

	const imageData = ctx.createImageData(width, height)
	imageData.data.set(pixels)
	ctx.clearRect(0, 0, width, height)
	ctx.putImageData(imageData, 0, 0)
}
</script>

<template>
	<canvas ref="canvas" aria-hidden="true" />
</template>
