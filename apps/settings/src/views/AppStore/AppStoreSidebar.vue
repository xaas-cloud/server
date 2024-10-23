<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<!-- Selected app details -->
	<NcAppSidebar v-if="showSidebar"
		class="app-sidebar"
		:class="{ 'app-sidebar--with-screenshot': hasScreenshot }"
		:active.sync="activeTab"
		:background="hasScreenshot ? app.screenshot : undefined"
		:compact="!hasScreenshot"
		:name="app.name"
		:title="app.name"
		:subname="licenseText"
		:subtitle="licenseText"
		@close="hideAppDetails">
		<!-- Fallback icon incase no app icon is available -->
		<template v-if="!hasScreenshot" #header>
			<AppItemIcon :app="app" class="app-sidebar__fallback-icon" />
		</template>

		<template #description>
			<!-- Featured/Supported badges -->
			<div class="app-sidebar__badges">
				<AppLevelBadge :level="app.level" />
				<AppScore v-if="appRating" :score="appRating" />
			</div>
		</template>

		<!-- Tab content -->
		<AppDescriptionTab :app="app" />
		<AppDetailsTab :app="app" />
		<AppReleasesTab :app="app" />
	</NcAppSidebar>
</template>

<script setup lang="ts">
import { translate as t } from '@nextcloud/l10n'
import { computed, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router/composables'
import { useAppRating } from '../../composables/useAppRating.ts'
import { useAppStore } from '../../store/appStore.ts'
import { preloadImage } from '../../service/imagePreloading.ts'

import NcAppSidebar from '@nextcloud/vue/dist/Components/NcAppSidebar.js'
import AppScore from '../../components/AppStore/AppScore.vue'
import AppLevelBadge from '../../components/AppStore/AppLevelBadge.vue'
import AppDescriptionTab from '../../components/AppStore/AppStoreSidebar/AppDescriptionTab.vue'
import AppDetailsTab from '../../components/AppStore/AppStoreSidebar/AppDetailsTab.vue'
import AppReleasesTab from '../../components/AppStore/AppStoreSidebar/AppReleasesTab.vue'
import AppItemIcon from '../../components/AppStore/AppItem/AppItemIcon.vue'
import logger from '../../logger.ts'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const appId = computed(() => route.params.appId ?? '')
const app = computed(() => store.getAppById(appId.value)!)
const appRating = useAppRating(app)

const showSidebar = computed(() => app.value !== null)

/**
 * The second text line shown on the sidebar
 */
const licenseText = computed(() => app.value ? t('settings', 'Version {version}, {license}-licensed', { version: app.value.version, license: app.value.licence.toString().toUpperCase() }) : '')

const activeTab = ref('details')
watch([app], () => { activeTab.value = 'details' })

/**
 * Hide the details sidebar by pushing a new route
 */
const hideAppDetails = () => {
	router.push(route.name === 'discover'
		? { name: 'discover' }
		: { name: 'app-category', params: { category: route.params.category } },
	)
}

/**
 * Whether the app screenshot is loaded
 */
const screenshotLoaded = ref(false)
const hasScreenshot = computed(() => app.value?.screenshot && screenshotLoaded.value)
watchEffect(() => {
	if (app.value?.screenshot) {
		screenshotLoaded.value = false
		preloadImage(app.value.screenshot)
			.then(() => { screenshotLoaded.value = true })
			.catch((error) => logger.warn('Could not load preview for app', { app: app.value, error }))
	}
})
</script>

<style scoped lang="scss">
.app-sidebar {
	// If a screenshot is available it should cover the whole figure
	&--with-screenshot {
		:deep(.app-sidebar-header__figure) {
			background-size: cover;
		}
	}

	&__fallback-icon {
		--app-icon-size: 100% !important;
	}

	&__badges {
		display: flex;
		flex-direction: row;
		gap: 12px;
	}

	&__version {
		color: var(--color-text-maxcontrast);
	}
}
</style>
