<!--
  - SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import type { IAppStoreApp } from '../../../constants/AppStoreTypes'
import { t } from '@nextcloud/l10n'
import { ref, toRef } from 'vue'
import { useAppManagement } from '../../../composables/useAppManagement'
import StatefulButton from './StatefulButton.vue'
import { useAppState } from '../../../composables/useAppState'

const props = defineProps<{
	app: IAppStoreApp
	dataItemTag: 'td'|'div'
	listView?: boolean
}>()

const {
	canInstall,
	canUninstall,
} = useAppState(toRef(props, 'app'))

const {
	disableApp,
	enableApp,
	forceEnable,
	updateApp,
	uninstallApp,
} = useAppManagement()

const isLoading = ref(false)
</script>

<template>
	<component :is="dataItemTag"
		class="app-item-actions"
		:class="{ 'app-item-actions--grid': !listView }">
		<div class="app-item-actions__wrapper">
			<StatefulButton v-if="app.update"
				:disabled="isLoading"
				type="primary"
				@click="updateApp(app)">
				{{ t('settings', 'Update to {update}', { update: app.update }) }}
			</StatefulButton>
			<StatefulButton v-if="canUninstall"
				class="app-item-actions__uninstall"
				:disabled="isLoading"
				type="tertiary"
				@click="uninstallApp(app)">
				{{ t('settings', 'Uninstall') }}
			</StatefulButton>
			<StatefulButton v-if="app.active"
				:disabled="isLoading"
				@click="disableApp(app)">
				{{ t('settings', 'Disable') }}
			</StatefulButton>
			<StatefulButton v-if="!app.active && canInstall"
				:title="app.needsDownload && !isLoading ? t('settings', 'The app will be downloaded from the App Store') : undefined"
				:type="listView ? 'secondary' : 'primary'"
				:disabled="isLoading"
				@click="enableApp(app)">
				{{ app.needsDownload ? t('settings', 'Download and enable') : t('settings', 'Enable') }}
			</StatefulButton>
			<StatefulButton v-else-if="!app.active && !app.isCompatible"
				type="tertiary"
				:disabled="isLoading"
				@click="forceEnable(app)">
				{{ t('settings', 'Allow untested app') }}
			</StatefulButton>
		</div>
	</component>
</template>

<style scoped lang="scss">
.app-item-actions {
	&--grid {
		align-self: end;
		margin-block-start: auto;

		.app-item-actions__wrapper {
			flex-wrap: wrap;
		}
	}

	&__wrapper {
		display: flex;
		flex-direction: row;
		gap: var(--default-grid-baseline);
		justify-content: end;
		width: 100%;
	}

	&__uninstall {
		color: var(--color-error-text);
	}
}
</style>
