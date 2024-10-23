<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<NcAppSidebarTab id="details"
		:name="t('settings', 'Details')"
		:order="1">
		<template #icon>
			<NcIconSvgWrapper :path="mdiTextBox" />
		</template>
		<div class="app-details">
			<div class="app-details__actions">
				<AppItemActions :app="app"
					class="app-details__actions-manage"
					data-item-tag="div" />
				<AppDetailsTabLimitGroups v-if="app.active" :app="app" />
			</div>

			<NcNoteCard v-if="!canInstall">
				<template #icon>
					<span />
				</template>
				<p class="app-details__dependency-note">
					{{ t('settings', 'This app cannot be installed because the following dependencies are not fulfilled:') }}
				</p>
				<ul :aria-label="t('settings', 'Missing dependencies')" class="missing-dependencies">
					<li v-for="(dep, index) in app.missingDependencies" :key="index">
						{{ dep }}
					</li>
				</ul>
			</NcNoteCard>

			<NcNoteCard v-if="app.shipped"
				:text="t('settings', 'This app is bundled with Nextcloud.')"
				type="info" />
			<div v-else-if="lastModified" class="app-details__section">
				<h4>
					{{ t('settings', 'Latest updated') }}
				</h4>
				<NcDateTime :timestamp="lastModified" />
			</div>

			<div class="app-details__section">
				<h4>
					{{ t('settings', 'Author') }}
				</h4>
				<p class="app-details__authors">
					{{ appAuthors }}
				</p>
			</div>

			<div class="app-details__section">
				<h4>
					{{ t('settings', 'Categories') }}
				</h4>
				<p>
					{{ appCategories }}
				</p>
			</div>

			<div v-if="externalResources.length > 0" class="app-details__section">
				<h4>{{ t('settings', 'Resources') }}</h4>
				<ul class="app-details__documentation" :aria-label="t('settings', 'Documentation')">
					<li v-for="resource of externalResources" :key="resource.id">
						<a class="appslink"
							:href="resource.href"
							target="_blank"
							rel="noreferrer noopener">
							{{ resource.label }} ↗
						</a>
					</li>
				</ul>
			</div>

			<div class="app-details__section">
				<h4>{{ t('settings', 'Interact') }}</h4>
				<div class="app-details__interact">
					<NcButton :disabled="!app.bugs"
						:aria-label="t('settings', 'Report a bug')"
						:href="app.bugs ?? '#'"
						target="_blank"
						:title="t('settings', 'Report a bug')">
						<template #icon>
							<NcIconSvgWrapper :path="mdiBug" />
						</template>
					</NcButton>
					<NcButton :disabled="!app.bugs"
						:aria-label="t('settings', 'Request feature')"
						:href="app.bugs ?? '#'"
						target="_blank"
						:title="t('settings', 'Request feature')">
						<template #icon>
							<NcIconSvgWrapper :path="mdiFeatureSearch" />
						</template>
					</NcButton>
					<NcButton v-if="app.appstoreData?.discussion"
						:aria-label="t('settings', 'Ask questions or discuss')"
						:href="app.appstoreData.discussion"
						target="_blank"
						:title="t('settings', 'Ask questions or discuss')">
						<template #icon>
							<NcIconSvgWrapper :path="mdiTooltipQuestion" />
						</template>
					</NcButton>
					<NcButton v-if="!app.shipped"
						:aria-label="t('settings', 'Rate the app')"
						:href="rateAppUrl"
						target="_blank"
						:title="t('settings', 'Rate')">
						<template #icon>
							<NcIconSvgWrapper :path="mdiStar" />
						</template>
					</NcButton>
				</div>
			</div>
		</div>
	</NcAppSidebarTab>
</template>

<script setup lang="ts">
import type { IAppStoreApp } from '../../../constants/AppStoreTypes'

import { mdiBug, mdiFeatureSearch, mdiStar, mdiTextBox, mdiTooltipQuestion } from '@mdi/js'
import { t } from '@nextcloud/l10n'
import { computed, ref, toRef, watch } from 'vue'
import { useAppStore } from '../../../store/appStore'
import { useAppState } from '../../../composables/useAppState'

import AppDetailsTabLimitGroups from './AppDetailsTabLimitGroups.vue'
import AppItemActions from '../AppItem/AppItemActions.vue'
import NcAppSidebarTab from '@nextcloud/vue/dist/Components/NcAppSidebarTab.js'
import NcButton from '@nextcloud/vue/dist/Components/NcButton.js'
import NcDateTime from '@nextcloud/vue/dist/Components/NcDateTime.js'
import NcIconSvgWrapper from '@nextcloud/vue/dist/Components/NcIconSvgWrapper.js'
import NcNoteCard from '@nextcloud/vue/dist/Components/NcNoteCard.js'

const props = defineProps<{ app: IAppStoreApp }>()
const store = useAppStore()

const { canInstall } = useAppState(toRef(props, 'app'))

/**
 * Is this app limited to specific groups
 */
const limitAppToGroups = ref(false)
watch(() => props.app.groups, () => {
	limitAppToGroups.value = props.app.groups.length > 0
}, { immediate: true })

/**
 * Date of last release of this app
 */
const lastModified = computed(() => (props.app?.releases ?? [])
	.map(({ lastModified }) => Date.parse(lastModified))
	.sort()
	.at(0) ?? null,
)

/**
 * App authors as comma separated string
 */
const appAuthors = computed(() => {
	const authors = Array.isArray(props.app.author)
		? props.app.author.map(authorName)
		: [authorName(props.app.author)]

	return authors
		.sort((a, b) => a.split(' ').at(-1).localeCompare(b.split(' ').at(-1)))
		.join(', ')
})

/**
 * URL of this app in the app store
 */
const appstoreUrl = computed(() => `https://apps.nextcloud.com/apps/${props.app.id}`)

/**
 * URL to rate this app on the app store
 */
const rateAppUrl = computed(() => `${appstoreUrl.value}#comments`)

/**
 * The categories this app is part of (formatted display names)
 */
const appCategories = computed(() => [props.app.category].flat()
	.map((id) => store.getCategoryById(id)?.displayName ?? id)
	.join(', '),
)

/**
 * Further external resources (e.g. website)
 */
const externalResources = computed(() => {
	const resources: { id: string, href: string, label: string }[] = []

	if (!props.app.shipped) {
		resources.push({
			id: 'appstore',
			href: appstoreUrl.value,
			label: t('settings', 'View in store'),
		})
	}
	if (props.app.website) {
		resources.push({
			id: 'website',
			href: props.app.website,
			label: t('settings', 'Visit website'),
		})
	}
	if (props.app.documentation) {
		if (props.app.documentation.user) {
			resources.push({
				id: 'doc-user',
				href: props.app.documentation.user,
				label: t('settings', 'Usage documentation'),
			})
		}
		if (props.app.documentation.admin) {
			resources.push({
				id: 'doc-admin',
				href: props.app.documentation.admin,
				label: t('settings', 'Admin documentation'),
			})
		}
		if (props.app.documentation.developer) {
			resources.push({
				id: 'doc-developer',
				href: props.app.documentation.developer,
				label: t('settings', 'Developer documentation'),
			})
		}
	}
	return resources
})

/**
 * Format an author name
 * @param xmlNode the XML node from the app store
 */
function authorName(xmlNode) {
	if (xmlNode['@value']) {
		// Complex node (with email or homepage attribute)
		return xmlNode['@value']
	}
	// Simple text node
	return xmlNode
}
</script>

<style scoped lang="scss">
.app-details {
	padding: calc(2 * var(--default-grid-baseline));

	&__actions {
		// app management
		&-manage {
			margin-block-end: calc(2 * var(--default-grid-baseline));

			:deep(.app-item-actions__wrapper) {
				justify-content: start;
			}

			// if too many, shrink them and ellipsis
			:deep(button) {
				flex: 1;
				min-width: 0;
				text-overflow: ellipsis;
				white-space: nowrap;
				overflow: hidden;
			}
		}
	}

	&__dependency-note {
		margin-block-end: var(--default-grid-baseline);
	}

	&__section {
		margin-top: calc(3 * var(--default-grid-baseline));
		color: var(--color-text-maxcontrast);

		h4 {
			color: var(--color-main-text);
			font-size: 16px;
			font-weight: bold;
			margin-block-end: var(--default-grid-baseline);
		}
	}

	&__interact {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 12px;
	}

	&__documentation {
		a {
			text-decoration: underline;
		}
		li {
			padding-inline-start: 20px;

			&::before {
				width: 5px;
				height: 5px;
				border-radius: 100%;
				background-color: var(--color-main-text);
				content: "";
				float: inline-start;
				margin-inline-start: -13px;
				position: relative;
				top: 10px;
			}
		}
	}
}

.force {
	color: var(--color-error);
	border-color: var(--color-error);
	background: var(--color-main-background);
}
.force:hover,
.force:active {
	color: var(--color-main-background);
	border-color: var(--color-error) !important;
	background: var(--color-error);
}

.missing-dependencies {
	list-style: initial;
	list-style-type: initial;
	list-style-position: inside;
}
</style>
