<!--
  - SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<a v-if="linkProps" v-bind="linkProps">
		<slot />
	</a>
	<RouterLink v-else v-bind="routerProps">
		<slot />
	</RouterLink>
</template>

<script setup lang="ts">
/**
 * This component either shows a native link to the installed app or external size - or a router link to the appstore page of the app if not installed
 * @module AppLink
 */
import type { INavigationEntry } from '../../../../../../core/src/types/navigation'

import { loadState } from '@nextcloud/initial-state'
import { generateUrl } from '@nextcloud/router'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps<{ href: string }>()

const apps = loadState<INavigationEntry[]>('core', 'apps')
const knownRoutes = Object.fromEntries(apps.map((app) => [app.app ?? app.id, app.href]))

/**
 * Properties for the anchor element.
 * If the app is installed we can open its route so we try to find a matching route.
 */
const linkProps = computed(() => {
	const match = props.href.match(/^app:\/\/([^/]+)(\/.+)?$/)
	if (match === null) {
		// not an app URL so it is a link
		return {
			href: props.href,
			target: '_blank',
			rel: 'noreferrer noopener',
		}
	}

	// check if an app internal path was requested
	if (match[2]) {
		// we do no know anything about app internal path so we only allow generic app paths
		return {
			href: generateUrl(`/apps/${match[1]}${match[2]}`),
		}
	}
	// If we know any route for that app we open it
	if (match[1] in knownRoutes) {
		return {
			href: knownRoutes[match[1]],
		}
	}
	// nothing found fall back to just open the app store entry
	return undefined
})

/**
 * Fallback to show the app store entry
 */
const routerProps = computed(() => {
	const match = props.href.match(/^app:\/\/([^/]+)(\/.+)?$/)
	return {
		to: {
			name: 'discover',
			params: {
				appId: match![1],
			},
		},
	}
})
</script>
