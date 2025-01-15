<!--
  - SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcBreadcrumbs data-cy-files-content-breadcrumbs
		:aria-label="t('files', 'Current directory path')"
		class="files-list__breadcrumbs"
		:class="{ 'files-list__breadcrumbs--with-progress': wrapUploadProgressBar }">
		<!-- Current path sections -->
		<NcBreadcrumb v-for="(section, index) in sections"
			:key="section.dir"
			v-files-drop.prevent="section.onDrop"
			dir="auto"
			exact
			:name="folders[section.dir]?.displayname || section.name"
			:to="section.to"
			:force-icon-text="index === 0 && fileListWidth >= 486"
			:title="titleForSection(index, section)"
			:aria-description="ariaForSection(section)"
			@click.native="onClick(section.to)"
			@dragover.native="onDragOver($event, section.dir)">
			<template v-if="index === 0" #icon>
				<NcIconSvgWrapper :size="20"
					:svg="viewIcon" />
			</template>
		</NcBreadcrumb>

		<!-- Forward the actions slot -->
		<template #actions>
			<slot name="actions" />
		</template>
	</NcBreadcrumbs>
</template>

<script lang="ts">
import { FileType, Permission, type Folder, type Node } from '@nextcloud/files'
import type { FileSource } from '../types.ts'

import { basename } from 'path'
import { defineComponent } from 'vue'
import { translate as t } from '@nextcloud/l10n'
import HomeSvg from '@mdi/svg/svg/home.svg?raw'
import NcBreadcrumb from '@nextcloud/vue/dist/Components/NcBreadcrumb.js'
import NcBreadcrumbs from '@nextcloud/vue/dist/Components/NcBreadcrumbs.js'
import NcIconSvgWrapper from '@nextcloud/vue/dist/Components/NcIconSvgWrapper.js'

import { useNavigation } from '../composables/useNavigation.ts'
import { useFileListWidth } from '../composables/useFileListWidth.ts'
import { useDragAndDropStore } from '../store/dragging.ts'
import { useFilesStore } from '../store/files.ts'
import { usePathsStore } from '../store/paths.ts'
import { useSelectionStore } from '../store/selection.ts'
import { useUploaderStore } from '../store/uploader.ts'
import vFilesDrop from '../directives/vFilesDrop.ts'
import type { Location } from 'vue-router'
import { emit } from '@nextcloud/event-bus'

export default defineComponent({
	name: 'BreadCrumbs',

	components: {
		NcBreadcrumbs,
		NcBreadcrumb,
		NcIconSvgWrapper,
	},

	props: {
		path: {
			type: String,
			default: '/',
		},
	},

	setup() {
		const draggingStore = useDragAndDropStore()
		const filesStore = useFilesStore()
		const pathsStore = usePathsStore()
		const selectionStore = useSelectionStore()
		const uploaderStore = useUploaderStore()
		const fileListWidth = useFileListWidth()
		const { currentView, views } = useNavigation()

		return {
			draggingStore,
			filesStore,
			pathsStore,
			selectionStore,
			uploaderStore,

			currentView,
			fileListWidth,
			views,
			vFilesDrop,
		}
	},

	data() {
		return {
			folders: {} as Record<string, Folder>,
		}
	},

	computed: {
		dirs(): string[] {
			const cumulativePath = (acc: string) => (value: string) => (acc += `${value}/`)
			// Generate a cumulative path for each path segment: ['/', '/foo', '/foo/bar', ...] etc
			const paths: string[] = this.path.split('/').filter(Boolean).map(cumulativePath('/'))
			// Strip away trailing slash
			return ['/', ...paths.map((path: string) => path.replace(/^(.+)\/$/, '$1'))]
		},

		sections() {
			return this.dirs.map((dir) => ({
				dir,
				to: this.getTo(dir),
				name: basename(dir),
				onDrop: () => this.onDrop(dir),
			}))
		},

		isUploadInProgress(): boolean {
			return this.uploaderStore.queue.length !== 0
		},

		// Hide breadcrumbs if an upload is ongoing
		wrapUploadProgressBar(): boolean {
			// if an upload is ongoing, and on small screens / mobile, then
			// show the progress bar for the upload below breadcrumbs
			return this.isUploadInProgress && this.fileListWidth < 512
		},

		// used to show the views icon for the first breadcrumb
		viewIcon(): string {
			return this.currentView?.icon ?? HomeSvg
		},

		selectedFiles() {
			return this.selectionStore.selected as FileSource[]
		},

		draggingFiles() {
			return this.draggingStore.dragging as FileSource[]
		},
	},

	watch: {
		currentView() {
			this.folders = {}
		},
	},

	methods: {
		async onDrop(dir: string) {
			const source = this.getFileSourceFromPath(dir)
			let folder = source ? this.getNodeFromSource(source) : undefined
			if (folder === undefined) {
				const result = await this.currentView!.getContents(dir)
				folder = result.folder
				// Cache folder and children (potentially also part of the breadcrumbs)
				emit('files:node:created', folder)
				result.contents.forEach((node) => {
					if (node.type === FileType.Folder && this.getNodeFromSource(node.source) === undefined) {
						emit('files:node:created', node)
					}
				})
			}
			this.folders[dir] = folder as Folder

			return {
				disabled: !(folder.permissions & Permission.CREATE),
				targetFolder: folder,
			}
		},

		getNodeFromSource(source: FileSource): Node | undefined {
			return this.filesStore.getNode(source)
		},
		getFileSourceFromPath(path: string): FileSource | null {
			return (this.currentView && this.pathsStore.getPath(this.currentView.id, path)) ?? null
		},
		getDirDisplayName(path: string, node: Node): string {
			if (path === '/') {
				return this.$navigation?.active?.name || t('files', 'Home')
			}

			return node?.displayname || basename(path)
		},

		getTo(dir: string, node?: Node): Location {
			const location = this.$route as Location
			if (dir === '/') {
				return {
					...location,
					params: { view: this.currentView!.id },
					query: {},
				}
			}
			if (node === undefined) {
				const view = this.views.find(view => view.params?.dir === dir)
				return {
					...location,
					params: { fileid: view?.params?.fileid ?? '' },
					query: { dir },
				}
			}
			return {
				...location,
				params: { fileid: String(node.fileid) },
				query: { dir: node.path },
			}
		},

		onClick(to) {
			if (to?.query?.dir === this.$route.query.dir) {
				this.$emit('reload')
			}
		},

		onDragOver(event: DragEvent, path: string) {
			if (!event.dataTransfer) {
				return
			}

			// Cannot drop on the current directory
			if (path === this.dirs[this.dirs.length - 1]) {
				event.dataTransfer.dropEffect = 'none'
				return
			}

			// Handle copy/move drag and drop
			if (event.ctrlKey) {
				event.dataTransfer.dropEffect = 'copy'
			} else {
				event.dataTransfer.dropEffect = 'move'
			}
		},

		titleForSection(index, section) {
			if (section?.to?.query?.dir === this.$route.query.dir) {
				return t('files', 'Reload current directory')
			} else if (index === 0) {
				return t('files', 'Go to the "{dir}" directory', section)
			}
			return null
		},

		ariaForSection(section) {
			if (section?.to?.query?.dir === this.$route.query.dir) {
				return t('files', 'Reload current directory')
			}
			return null
		},

		t,
	},
})
</script>

<style lang="scss" scoped>
.files-list__breadcrumbs {
	// Take as much space as possible
	flex: 1 1 100% !important;
	width: 100%;
	height: 100%;
	margin-block: 0;
	margin-inline: 10px;
	min-width: 0;

	:deep() {
		a {
			cursor: pointer !important;
		}
	}

	&--with-progress {
		flex-direction: column !important;
		align-items: flex-start !important;
	}
}
</style>
