/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import PQueue from 'p-queue'

const queue = new PQueue({ concurrency: 5 })

/**
 * Preload a given image URL, the requests are limited to a specific concurrency to not overload any host.
 * @param url The image URL to preload
 */
export function preloadImage(url: string): Promise<void> {
	return queue.add(async () => {
		const { promise, resolve, reject } = Promise.withResolvers()

		const img = new Image()
		img.onload = resolve
		img.onerror = reject
		img.src = url

		await promise
	})
}
