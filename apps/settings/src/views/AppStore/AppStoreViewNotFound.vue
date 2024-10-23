<!--
  - SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { t } from '@nextcloud/l10n'
import NcButton from '@nextcloud/vue/dist/Components/NcButton.js'
import NcEmptyContent from '@nextcloud/vue/dist/Components/NcEmptyContent.js'
import IconMagnify from 'vue-material-design-icons/Magnify.vue'
</script>

<template>
	<NcEmptyContent class="app-store-not-found"
		:name="t('settings', 'Category not found')">
		<template #icon>
			<IconMagnify :size="64" />
		</template>
		<template #action>
			<NcButton type="primary" :to="{ name: 'apps' }">
				{{ t('settings', 'Go back') }}
			</NcButton>
		</template>
	</NcEmptyContent>
</template>

<style scoped>
.app-store-not-found {
	height: 100%;
}
</style>
