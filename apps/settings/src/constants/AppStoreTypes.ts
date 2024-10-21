/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface IAppStoreCategory {
	/**
	 * The category ID
	 */
	id: string
	/**
	 * The display name (can be localized)
	 */
	displayName: string
	/**
	 * Inline SVG path
	 */
	icon: string
}

export interface IAppStoreAppRelease {
	version: string
	lastModified: string
	translations: {
		[key: string]: {
			changelog: string
		}
	}
}

export interface IAppStoreBundle {
	/** Id to identify the bundle (see IAppStoreApp.bundleIds) */
	id: string
	/** Localized name */
	name: string
	/** @private Internal flag */
	isCategory?: boolean
}

export interface IAppStoreApp {
	/** The app id */
	id: string
	/** Display name of the app */
	name: string
	/** Summary describing the app */
	summary: string
	/** Longer description that could contain Markdown */
	description: string
	/** License applied to this app */
	licence: string
	author: string[] | Record<string, string>
	/**
	 * Support level of this app.
	 * 100 = community app
	 * 200 = featured by Nextcloud
	 * 300 = included in support subscription
	 */
	level: number
	/** Rating score of this app on the app store */
	score: number
	/** Recent rating / score of this app on the app store */
	ratingRecent: number
	/** Number of overall ratings of this app on the app store */
	ratingNumOverall: number
	/** Number of recent ratings of this app on the app store */
	ratingNumRecent: number
	/** Version string of this app */
	version: string
	/** Category or categories applied to this app */
	category: string|string[]
	/** Bundles this app is part of */
	bundleIds?: string[]
	/** Types assigned to the app, e.g. `filesystem` */
	types: string[]
	/** Groups this app is limited to */
	groups: string[]
	/** URL of a preview image */
	preview?: string
	/** The preview is an icon */
	previewAsIcon: boolean
	/** URL of a screenshot of the app */
	screenshot?: string

	// Properties applied from Nextcloud not from the app store

	/** If this app is currently enabled */
	active: boolean
	/** If this is an app shipped with the Nextcloud release */
	shipped: boolean
	/** If this app is currently installed */
	installed: boolean
	/** App is compatible with current Nextcloud version */
	isCompatible: boolean
	/** If the app was force enabled (ignore compatible Nextcloud version) */
	isForceEnabled: boolean
	/** App needs to be downloaded from app store first */
	needsDownload?: boolean
	/** Available version to update to */
	update?: string
	/** Dependencies missing for installation */
	missingDependencies?: string[]

	/** URL of the app website */
	website?: string
	/** URL of the issue tracker */
	bugs?: string
	/** Optional documentation for this app */
	documentation?: {
		/** URL of user documentation */
		user?: string
		/** URL of admin documentation */
		admin?: string
		/** URL of developer documentation */
		developer?: string
	}

	appstoreData?: Record<string, unknown>
	releases?: IAppStoreAppRelease[]
}
