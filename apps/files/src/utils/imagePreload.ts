/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { CancelablePromise } from 'cancelable-promise'
import PQueue from 'p-queue'

const queue = new PQueue({ concurrency: 5 })

/**
 * Preload an image URL
 * @param url URL of the image
 */
export function preloadImage(url: string): CancelablePromise<boolean> {
	const { resolve, promise } = Promise.withResolvers<boolean>()
	const image = new Image()

	queue.add(() => {
		image.onerror = () => resolve(false)
		image.onload = () => resolve(true)
		image.src = url
		return promise
	})

	return Object.assign(promise, {
		cancel: () => {
			image.src = ''
			resolve(false)
		},
	}) as CancelablePromise<boolean>
}
