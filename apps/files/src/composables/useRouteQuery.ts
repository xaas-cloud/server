/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Route } from 'vue-router'

import { computed } from 'vue'
import { useRoute } from 'vue-router/composables'

type RouteQueryType = Route['query'][string]

/**
 * Get the first non-null value from a route query
 * @param query The query param(s)
 */
function getFirstQuery(query: RouteQueryType): string | null {
	return [query].flat().find((value) => value !== null) ?? null
}

/**
 * Get common route query attributes
 * This also handles possible attribute duplicates
 */
export const useRouteQuery = () => {
	const route = useRoute()

	/**
	 * The current dir set on the route query without trailing slash
	 * If set multiple times, the first non emtpy one is used
	 * @default '/'
	 */
	const dir = computed(() => (getFirstQuery(route.query.dir) ?? '/').replace(/^(.+)\/$/, '$1'))

	/**
	 * Get the file id from the route params
	 * If no file id is set `null` will returned
	 */
	const fileId = computed(() => {
		const number = Number.parseInt(route.params.fileid)
		return Number.isNaN(number) ? null : number
	})

	/**
	 * Get the current open state of the active file
	 * This is true if `openfile` is set to `true` on the query
	 */
	const isOpenFile = computed(() => getFirstQuery(route.query.openfile) === 'true')

	return {
		dir,
		fileId,
		isOpenFile,
	}
}
