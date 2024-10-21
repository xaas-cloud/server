/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { translate as t } from '@nextcloud/l10n'

/**
 * App store section names.
 * This is needed for internal sections that have no already set display name by the backend.
 */
export const AppStoreSectionNames = Object.freeze({
	discover: t('settings', 'Discover'),
	installed: t('settings', 'Your apps'),
	enabled: t('settings', 'Active apps'),
	disabled: t('settings', 'Disabled apps'),
	updates: t('settings', 'Updates'),
	'app-bundles': t('settings', 'App bundles'),
	featured: t('settings', 'Featured apps'),
	supported: t('settings', 'Supported apps'), // From support subscription
})

/**
 * App store categories that use the list view instead of the grid view
 */
export const AppStoreListViewCategories = Object.freeze([
	'disabled',
	'enabled',
	'featured',
	'installed',
	'supported',
	'updates',
	'app-bundles',
])

/**
 * Internal category used for the "results from other categories" fake-bundle
 */
export const AppStoreSearchResultsCategory = 'search-results'

/**
 * This app types can not be limited to groups as they are forced to be enabled for all users
 */
export const AlwaysEnabledAppTypes = [
	'filesystem',
	'prelogin',
	'authentication',
	'logging',
	'prevent_group_restriction',
]
