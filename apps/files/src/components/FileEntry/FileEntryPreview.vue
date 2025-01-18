<!--
  - SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<span class="files-list__row-icon">
		<template v-if="source.type === 'folder'">
			<FolderOpenIcon v-if="dragover" v-once />
			<template v-else>
				<FolderIcon v-once />
				<OverlayIcon :is="folderOverlay"
					v-if="folderOverlay"
					class="files-list__row-icon-overlay" />
			</template>
		</template>

		<span v-else class="files-list__row-icon-preview-container">
			<BlurHash v-if="blurHash && showBlurHash"
				class="files-list__row-icon-blurhash"
				:hash="blurHash" />

			<img v-else-if="previewUrl && showPreview"
				alt=""
				class="files-list__row-icon-preview"
				:src="previewUrl.href">

			<FileIcon v-else v-once />
		</span>

		<!-- Favorite icon -->
		<span v-if="isFavorite" class="files-list__row-icon-favorite">
			<FavoriteIcon v-once />
		</span>

		<OverlayIcon :is="fileOverlay"
			v-if="fileOverlay"
			class="files-list__row-icon-overlay files-list__row-icon-overlay--file" />
	</span>
</template>

<script lang="ts">
import type { PropType } from 'vue'

import { Node, FileType } from '@nextcloud/files'
import { translate as t } from '@nextcloud/l10n'
import { ShareType } from '@nextcloud/sharing'
import { getSharingToken, isPublicShare } from '@nextcloud/sharing/public'
import { computed, defineComponent } from 'vue'

import AccountGroupIcon from 'vue-material-design-icons/AccountGroup.vue'
import AccountPlusIcon from 'vue-material-design-icons/AccountPlus.vue'
import FileIcon from 'vue-material-design-icons/File.vue'
import FolderIcon from 'vue-material-design-icons/Folder.vue'
import FolderOpenIcon from 'vue-material-design-icons/FolderOpen.vue'
import KeyIcon from 'vue-material-design-icons/Key.vue'
import LinkIcon from 'vue-material-design-icons/Link.vue'
import NetworkIcon from 'vue-material-design-icons/Network.vue'
import TagIcon from 'vue-material-design-icons/Tag.vue'
import PlayCircleIcon from 'vue-material-design-icons/PlayCircle.vue'

import BlurHash from './BlurHash.vue'
import CollectivesIcon from './CollectivesIcon.vue'
import FavoriteIcon from './FavoriteIcon.vue'

import { isLivePhoto } from '../../services/LivePhotos'
import { useUserConfigStore } from '../../store/userconfig.ts'
import { usePreviewUrl } from '../../composables/usePreview.ts'

export default defineComponent({
	name: 'FileEntryPreview',

	components: {
		AccountGroupIcon,
		AccountPlusIcon,
		BlurHash,
		CollectivesIcon,
		FavoriteIcon,
		FileIcon,
		FolderIcon,
		FolderOpenIcon,
		KeyIcon,
		LinkIcon,
		NetworkIcon,
		TagIcon,
	},

	props: {
		source: {
			type: Object as PropType<Node>,
			required: true,
		},
		dragover: {
			type: Boolean,
			default: false,
		},
		gridMode: {
			type: Boolean,
			default: false,
		},
	},

	setup(props) {
		const userConfigStore = useUserConfigStore()
		const isPublic = isPublicShare()
		const publicSharingToken = getSharingToken()

		// Options of the preview URL
		// This needs to be reactive to react to user config changes
		// as well as changing of the grid mode
		const previewSettings = computed(() => ({
			cropPreview: userConfigStore.userConfig.crop_image_previews,
			mimeFallback: true,
			size: props.gridMode ? 128 : 32,
		}))

		return {
			isPublic,
			publicSharingToken,
			...usePreviewUrl(() => props.source, previewSettings),
		}
	},

	computed: {
		isFavorite(): boolean {
			return this.source.attributes.favorite === 1
		},

		fileOverlay() {
			if (isLivePhoto(this.source)) {
				return PlayCircleIcon
			}

			return null
		},

		folderOverlay() {
			if (this.source.type !== FileType.Folder) {
				return null
			}

			// Encrypted folders
			if (this.source?.attributes?.['is-encrypted'] === 1) {
				return KeyIcon
			}

			// System tags
			if (this.source?.attributes?.['is-tag']) {
				return TagIcon
			}

			// Link and mail shared folders
			const shareTypes = Object.values(this.source?.attributes?.['share-types'] || {}).flat() as number[]
			if (shareTypes.some(type => type === ShareType.Link || type === ShareType.Email)) {
				return LinkIcon
			}

			// Shared folders
			if (shareTypes.length > 0) {
				return AccountPlusIcon
			}

			switch (this.source?.attributes?.['mount-type']) {
			case 'external':
			case 'external-session':
				return NetworkIcon
			case 'group':
				return AccountGroupIcon
			case 'collective':
				return CollectivesIcon
			case 'shared':
				return AccountPlusIcon
			}

			return null
		},

		blurHash(): string | undefined {
			return this.source.attributes['metadata-blurhash']
		},

		/**
		 * If true the blue hash is shown instead of the preview
		 */
		showBlurHash(): boolean {
			return !!this.blurHash && !this.showPreview
		},

		/**
		 * If true the preview is shown,
		 * meaning a preview is available and loaded without errors
		 */
		showPreview(): boolean {
			return this.previewUrl !== null && this.previewLoaded
		},
	},

	methods: {
		// Called from FileEntry
		reset() {
			this.stopPreview()
		},

		t,
	},
})
</script>
