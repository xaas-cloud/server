/*!
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import type { IAppStoreApp, IAppStoreCategory } from '../constants/AppStoreTypes'
import { confirmPassword } from '@nextcloud/password-confirmation'
import { generateUrl } from '@nextcloud/router'
import axios from '@nextcloud/axios'

/**
 * @module AppStoreApi
 * This module provides API abstractions for the app store API for app management.
 */

/**
 * Enable one app - optionally limit it to some groups
 *
 * @param appId The app to enable
 * @param groups Groups to limit the apps to (optionally)
 */
export async function enableApp(appId: string, groups: string[] = []) {
	return enableApps([appId], groups)
}

/**
 * Enable apps - optionally limit their usage to some groups.
 * @param appIds Ids of the apps to enable
 * @param groups Groups to limit the apps to (optionally)
 * @return `true` on success, `false` if cancelled.
 * @throws if the network request fails
 */
export async function enableApps(appIds: string[], groups: string[] = []): Promise<boolean> {
	// This route requires password confirmation
	try {
		await confirmPassword()
	} catch (error) {
		return false
	}

	await axios.post(generateUrl('settings/apps/enable'), { appIds, groups })
	return true
}

/**
 * Disable one app
 *
 * @param appId The app to disable
 */
export async function disableApp(appId: string) {
	return await disableApps([appId])
}

/**
 * Disable multiple apps at once
 * @param appIds Ids of the apps to disable
 * @return `true` on success, `false` if cancelled
 * @throws on network error
 */
export async function disableApps(appIds: string[]): Promise<boolean> {
	// This route requires password confirmation
	try {
		await confirmPassword()
	} catch (error) {
		return false
	}

	await axios.post(generateUrl('settings/apps/disable'), { appIds })
	return true
}

/**
 * Force enables an app that does not officially work with the current server version.
 *
 * @param appId The app id
 */
export async function forceEnableApp(appId: string) {
	// This route requires password confirmation
	await confirmPassword()

	await axios.post(generateUrl('settings/apps/force'), { appId })
}

/**
 * Check the server health after an app was enabled
 *
 * @return True is everything is working, false if an update is required.
 * @throws When an error occurred - in this case the app needs to be disabled again.
 */
export async function checkServerHealth(): Promise<boolean> {
	const { data } = await axios.get(generateUrl('apps/files/'))

	return !Object.hasOwn(data, 'update_required')
}

/**
 * Uninstall an installed app
 *
 * @param appId The app id
 */
export async function uninstallApp(appId: string) {
	await confirmPassword()
	await axios.get(generateUrl(`settings/apps/uninstall/${appId}`))
}

/**
 * Update an installed app
 *
 * @param appId The app id
 * @param silent If set to true no notifications are shown to the user
 */
export async function updateApp(appId: string) {
	await confirmPassword()
	await axios.get(generateUrl(`settings/apps/update/${appId}`))
}

/**
 * Get all available apps
 */
export async function getAllApps(): Promise<IAppStoreApp[]> {
	const { data } = await axios.get<{ apps: IAppStoreApp[] }>(generateUrl('settings/apps/list'))
	return data.apps
}

/**
 * Get all available categories
 */
export async function getCategories(): Promise<IAppStoreCategory[]> {
	const { data } = await axios.get<IAppStoreCategory[]>(generateUrl('settings/apps/categories'))
	return data
}
