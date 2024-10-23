<!--
  - SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
/**
 * This component provides a simple wrapper over the NcButton to allow accessible disabled state.
 * @module StatefulButton
 */
import { t } from '@nextcloud/l10n'
import NcButton from '@nextcloud/vue/dist/Components/NcButton.js'

const props = defineProps<{
	disabled: boolean
}>()

const emit = defineEmits(['click'])

/**
 * Only forward the click event if not disabled
 * @param args potential event parameters
 */
function onClick(...args) {
	if (!props.disabled) {
		emit('click', ...args)
	}
}
</script>

<template>
	<NcButton :aria-disabled="disabled ? 'true' : undefined"
		:class="{ 'soft-disabled': disabled }"
		v-bind="$attrs"
		@click.stop="onClick">
		<slot />
		<span v-if="disabled" class="hidden-visually">
			{{ t('settings', '(app is loading)') }}
		</span>
	</NcButton>
</template>

<style scoped>
.soft-disabled {
	cursor: not-allowed;
	opacity: .7;
}
</style>
