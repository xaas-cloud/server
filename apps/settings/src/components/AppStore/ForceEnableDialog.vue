<script setup lang="ts">
import type { IAppStoreApp } from '../../constants/AppStoreTypes'

import { t } from '@nextcloud/l10n'
import NcDialog from '@nextcloud/vue/dist/Components/NcDialog.js'

defineProps<{
	app: IAppStoreApp
}>()

const emit = defineEmits<{
	(e: 'close', enable: boolean): void
}>()

const buttons = [
	{ label: t('settings', 'Cancel'), callback: () => emit('close', false) },
	{ label: t('settings', 'Force enable app'), type: 'primary', callback: () => emit('close', true) },
]
</script>

<template>
	<NcDialog :buttons="buttons"
		:name="t('settings', 'Force enable {app}', { app: app.name })"
		size="normal"
		@update:open="emit('close', false)">
		<p>
			{{ t('settings', 'This app is not marked as compatible with your Nextcloud version or server installation. If you continue you will still be able to install the app. Note that the app might not work as expected.') }}
		</p>
		<h3 id="force-enable-dialog-dependency-heading" class="force-enable-dialog__heading">
			{{ t('settings', 'Missing dependencies') }}
		</h3>
		<ul aria-labelledby="force-enable-dialog-dependency-heading" class="force-enable-dialog__list">
			<li v-for="dependency, index in app.missingDependencies" :key="index">
				{{ dependency }}
			</li>
		</ul>
	</NcDialog>
</template>

<style scoped>
.force-enable-dialog__heading {
	font-size: 1.3em;
}
.force-enable-dialog__list {
	list-style: disc;
	padding-inline-start: 1.25em;
}
</style>
