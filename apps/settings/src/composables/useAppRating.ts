/*!
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IAppStoreApp } from '../constants/AppStoreTypes'
import type { MaybeRef } from '@vueuse/core'

import { toValue } from '@vueuse/core'
import { computed } from 'vue'

/**
 * Get the app rating of an app.
 * If not enough information is available `undefined` is returned.
 *
 * @param app The app to get the rating
 */
export function useAppRating(app: MaybeRef<IAppStoreApp>) {
	const appRating = computed(() => {
		const appValue = toValue(app)
		if (appValue.ratingNumRecent > 5) {
			return appValue.ratingRecent
		}
		// Only show old ratings if there is at least one new rating
		if (appValue.ratingNumRecent > 0 && appValue.ratingNumOverall > 5) {
			return appValue.score
		}
		return undefined
	})
	return appRating
}
