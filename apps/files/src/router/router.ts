/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import type { RawLocation, Route } from 'vue-router'
import type { ErrorHandler } from 'vue-router/types/router.d.ts'

import { generateUrl } from '@nextcloud/router'
import Router from 'vue-router'
import Vue from 'vue'

Vue.use(Router)

// Prevent router from throwing errors when we're already on the page we're trying to go to
const originalPush = Router.prototype.push as (to, onComplete?, onAbort?) => Promise<Route>
Router.prototype.push = function push(to: RawLocation, onComplete?: ((route: Route) => void) | undefined, onAbort?: ErrorHandler | undefined): Promise<Route> {
	if (onComplete || onAbort) return originalPush.call(this, to, onComplete, onAbort)
	return originalPush.call(this, to).catch(err => err)
}

const router = new Router({
	mode: 'history',

	// if index.php is in the url AND we got this far, then it's working:
	// let's keep using index.php in the url
	base: generateUrl('/apps/files'),
	linkActiveClass: 'active',

	routes: [
		{
			path: '/',
			// Pretending we're using the default view
			redirect: { name: 'filelist', params: { view: 'files' } },
		},
		{
			path: '/:view/:fileid(\\d+)?',
			name: 'filelist',
			props: true,
		},
	],

	// Custom stringifyQuery to prevent encoding of slashes in the url
	stringifyQuery(query) {
		const params = new URLSearchParams(Object.entries(query))
		const result = params.toString().replace(/%2F/gmi, '/')
		// Only for vue-router 3 (vue2) we need to prepend a `?`
		return result ? ('?' + result) : ''
	},
})

export default router
