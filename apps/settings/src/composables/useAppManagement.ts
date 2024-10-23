/*!
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IAppStoreApp } from '../constants/AppStoreTypes'

import { showError, showInfo, showSuccess, spawnDialog, TOAST_PERMANENT_TIMEOUT } from '@nextcloud/dialogs'
import { t } from '@nextcloud/l10n'
import { defineAsyncComponent } from 'vue'
import { useAppStore } from '../store/appStore'
import * as api from '../service/AppStoreApi'
import logger from '../logger'

const ForceEnableDialog = defineAsyncComponent(() => import ('../components/AppStore/ForceEnableDialog.vue'))

/**
 * App management functions.
 * This provides helper functions that use the app store API to provide
 * app management functions with user feedback (notifications).
 */
export function useAppManagement() {
	const store = useAppStore()

	/**
	 * Disable an app
	 * @param app The app to disable
	 */
	async function disableApp(app: IAppStoreApp) {
		const info = showInfo(t('settings', 'Disabling {app}', { app: app.name }), { timeout: TOAST_PERMANENT_TIMEOUT })

		try {
			if (await api.disableApp(app.id)) {
				store.updateApp(app, { active: false })
				showSuccess(t('settings', 'Successfully disabled {app}', { app: app.name }))
			}
		} catch (error) {
			logger.error('Could not disable app', { app, error })
			showError(t('settings', 'Failed to disable {app}', { app: app.name }))
		} finally {
			info.hideToast()
		}
	}

	/**
	 * Enabling an app
	 * @param app The app to enabled
	 */
	async function enableApp(app: IAppStoreApp) {
		const info = showInfo(t('settings', 'Enabling {app}', { app: app.name }), { timeout: TOAST_PERMANENT_TIMEOUT })
		const groups = app.groups?.length > 0 ? app.groups : undefined

		try {
			if (await api.enableApp(app.id, groups) === false) {
				return
			}
		} catch (error) {
			logger.error('Could not enable app', { app, error })
			showError(t('settings', 'Failed to enable {app}', { app: app.name }))
		} finally {
			info.hideToast()
		}

		if (await checkServerHealth(app)) {
			store.updateApp(app, {
				active: true,
				installed: true,
				needsDownload: false,
			})
			showSuccess(t('settings', 'Successfully enabled {app}', { app: app.name }))
		}
	}

	/**
	 * Force enable an app
	 * @param app The app to force enable
	 */
	async function forceEnable(app: IAppStoreApp) {
		const userDecision = await new Promise((resolve) => spawnDialog(ForceEnableDialog, { app }, resolve))
		if (userDecision === false) {
			return
		}

		const info = showInfo(t('settings', 'Force enabling {app}', { app: app.name }))
		try {
			await api.forceEnableApp(app.id)
			store.updateApp(app, {
				isForceEnabled: true,
			})
		} catch (error) {
			showError(t('settings', 'Force enabling {app} failed', { app: app.name }))
			logger.error('Error while force enabling app', { app, error })
			return
		} finally {
			info.hideToast()
		}
	}

	/**
	 * Try to update an app on the server, returns true if the update was successful.
	 * @param app The app to update
	 */
	async function updateApp(app: IAppStoreApp) {
		const info = showInfo(t('settings', 'Starting update of {app}', { app: app.name }))
		try {
			await api.updateApp(app.id)
		} catch (error) {
			logger.error(`Could not update ${app.name}`, { error })
			showError(t('settings', 'Update of {app} failed', { app: app.name }))
			return
		} finally {
			info.hideToast()
		}

		if (await checkServerHealth(app)) {
			store.updateApp(app, {
				active: true,
				installed: true,
				update: undefined,
				version: app.update ?? app.version,
			})
			showSuccess(t('settings', 'Update of {app} was successfull', { app: app.name }))
		}
	}

	/**
	 * Uninstall an installed app
	 * @param app The app to uninstall
	 */
	async function uninstallApp(app: IAppStoreApp) {
		const info = showInfo(t('settings', 'Uninstalling {app}', { app: app.name }))
		try {
			await api.uninstallApp(app.id)
			store.updateApp(app, {
				active: false,
				installed: false,
				isForceEnabled: false,
				needsDownload: true,
				// We need to restore missing dependencies that were not included as the app was force-enabled when the site was loaded
				missingDependencies: app.isCompatible
					? app.missingDependencies
					: [t('settings', 'A lower server version is required')],
			})
			showSuccess(t('settings', 'Successfully uninstalled {app}', { app: app.name }))
		} catch (error) {
			logger.debug('Uninstall of app was cancelled', { app, error })
			showInfo(t('settings', 'Uninstallation of {app} was cancelled', { app: app.name }))
		} finally {
			info.hideToast()
		}
	}

	/**
	 * Helper to check the server health status after enabling / updating an app.
	 * If the server is instable after the action the app is disabled again.
	 * @param app The app that was enabled (to disable if it causes troubles)
	 */
	async function checkServerHealth(app: IAppStoreApp): Promise<boolean> {
		try {
			if (await api.checkServerHealth()) {
				return true
			} else {
				showInfo(
					t(
						'settings',
						'{app} has been enabled but needs to be updated. You will be redirected to the update page in 5 seconds.',
						{ app: app.name },
					),
					{
						onClick: () => window.location.reload(),
						close: false,
					},
				)
				setTimeout(function() {
					location.reload()
				}, 5000)
			}
			return true
		} catch (error) {
			logger.error('Error while updating or enabling app', { app, error })
			showError(t('settings', '{app} has been disabled because it makes the server instable.', { app: app.name }))
			await api.disableApp(app.id)

			store.updateApp(app, { active: false })
			return false
		}
	}

	return {
		disableApp,
		enableApp,
		forceEnable,
		uninstallApp,
		updateApp,
	}
}
