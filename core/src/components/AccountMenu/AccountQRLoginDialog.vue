<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { computed } from 'vue'
import NcDialog from '@nextcloud/vue/components/NcDialog'
import QR from '@chenfengyuan/vue-qrcode'
import { getBaseUrl } from '@nextcloud/router'
import {
	useFormatRelativeTime
} from "@nextcloud/vue/composables/useFormatDateTime"

const props = defineProps<{
	data: {
		token?: string
		loginName?: string
		deviceToken?: {
			id: number
			name: string
			lastActivity: number
			type: number
			scope: {
				filesystem: boolean
			}
			canDelete: boolean
			canRename: boolean
		}
	}
}>()

const emit = defineEmits<{
	(event: 'close', value?: unknown): void
}>()

const buttons = [{
	label: t('spreed', 'Done'),
	variant: 'primary',
	callback: () => undefined,
}]

const qrUrl = computed(() => {
	const user = props.data?.loginName ?? ''
	const password = props.data?.token ?? ''
	const server = getBaseUrl()

	// TODO return different result for error handling (to not provide invalid URL)
	return `nc://onetime-login/user:${user}&password:${password}&server:${server}`
})

const expirationTimestamp = (props.data?.deviceToken?.lastActivity * 1_000 ?? Date.now()) + 120_000
let expireTimeout = setTimeout(() => {
	onClosing('expired')
}, expirationTimestamp - Date.now())
const timeCountdown = useFormatRelativeTime(expirationTimestamp)

/**
 * Emit result, if any (for spawnDialog callback)
 *
 * @param result callback result
 */
function onClosing(result: unknown) {
	clearTimeout(expireTimeout)
	emit('close', result)
}
</script>

<template>
	<NcDialog :name="t('core', 'Scan QR code to log in')"
		:buttons="buttons"
		@closing="onClosing">
		<div class="qr-login__content">
			<QR :value="qrUrl" />
			<!-- TRANSLATORS Intl will provide a conjunction, e.g. 'Code will expire in 30 seconds' -->
			{{ t('core', 'Code will expire {timeCountdown}', { timeCountdown }) }}
		</div>
	</NcDialog>
</template>

<style lang="scss">
.qr-login__content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--default-grid-baseline);
}
</style>
