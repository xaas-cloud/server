import type { IAppStoreApp } from '../constants/AppStoreTypes'
import { toValue, type MaybeRef } from '@vueuse/core'
import { computed } from 'vue'

/**
 * Get the state of an app store app.
 * @param app The app to query the state
 */
export function useAppState(app: MaybeRef<IAppStoreApp>) {

	const canInstall = computed(() => {
		const appValue = toValue(app)
		const compatible = appValue.isCompatible || appValue.isForceEnabled
		const noMissingDependencies = appValue.missingDependencies === undefined
			|| appValue.missingDependencies.length === 0
			// ignore the initial missing server dependency
			|| appValue.missingDependencies.length === 1 && !appValue.isCompatible
		return compatible && noMissingDependencies
	})

	const canUninstall = computed(() => {
		const appData = toValue(app)
		// app is removable and not enabled
		return appData.installed && !appData.shipped && !appData.active
	})

	return {
		canInstall,
		canUninstall,
	}
}
