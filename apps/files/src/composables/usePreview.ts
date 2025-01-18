/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Node } from '@nextcloud/files'
import type { MaybeRef, MaybeRefOrGetter } from '@vueuse/core'
import type { CancelablePromise } from 'cancelable-promise'

import { generateUrl } from '@nextcloud/router'
import { toValue } from '@vueuse/core'
import { ref, watchEffect } from 'vue'
import { preloadImage } from '../utils/imagePreload'
import logger from '../logger'

interface PreviewOptions {
	/**
	 * Size of the previews in px
	 * @default 32
	 */
	size?: number
	/**
	 * Should the preview fall back to the mime type icon
	 * @default true
	 */
	mimeFallback?: boolean
	/**
	 * Should the preview be cropped or fitted
	 * @default false (meaning it gets fitted)
	 */
	cropPreview?: boolean
}

/**
 * Generate the preview URL of a file node
 *
 * @param node The node to generate the preview for
 * @param options Preview options
 */
export function getPreviewUrl(node: Node, options: PreviewOptions = {}): URL {
	options = { size: 32, cropPreview: false, mimeFallback: true, ...options }

	const previewUrl = node.attributes?.previewUrl
		|| generateUrl('/core/preview?fileId={fileid}', {
			fileid: node.fileid,
		})

	let url: URL
	try {
		url = new URL(previewUrl)
	} catch (e) {
		url = new URL(previewUrl, window.location.origin)
	}

	// Request preview with params
	url.searchParams.set('x', `${options.size}`)
	url.searchParams.set('y', `${options.size}`)
	url.searchParams.set('mimeFallback', `${options.mimeFallback}`)

	// Handle cropping
	url.searchParams.set('a', options.cropPreview === true ? '0' : '1')

	// Etag to force refresh preview on change
	const etag = node.attributes?.etag || ''
	url.searchParams.set('v', etag.slice(0, 6))

	return url
}

/**
 * Get and pre-load a the preview of a node.
 *
 * @param node The node to get the preview for
 * @param options Preview options
 */
export function usePreviewUrl(node: MaybeRefOrGetter<Node>, options?: MaybeRef<PreviewOptions>) {
	const previewUrl = ref<URL|null>(null)
	const previewLoaded = ref(false)
	const promise = ref<CancelablePromise<boolean>>()

	/**
	 * Stop the preview loading
	 */
	function stopPreview() {
		promise.value?.cancel()
	}

	watchEffect(() => {
		try {
			previewUrl.value = getPreviewUrl(toValue(node), toValue(options || {}))
		} catch (error) {
			// this can happen if the Node object was invalid
			// so lets be safe here
			logger.error('Failed to generate preview URL for node', { error, node })
			return
		} finally {
			previewLoaded.value = false
		}

		// Preload the image
		promise.value = preloadImage(previewUrl.value.href)
		promise.value.then((success: boolean) => {
			previewLoaded.value = success
		})
	})

	return {
		previewUrl,
		previewLoaded,
		stopPreview,
	}
}
