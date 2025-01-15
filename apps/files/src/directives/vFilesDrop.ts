import type { IFolder, INode } from '@nextcloud/files'
import type { Upload } from '@nextcloud/upload'
import type { DirectiveHook } from 'vue'
import type { VNode } from 'vue/types/umd'
import {
	onDropExternalFiles,
	onDropInternalFiles,
} from '../services/DropService'
import { useDragAndDropStore } from '../store/dragging'
import { useFilesStore } from '../store/files'
import logger from '../logger'

interface OnFileDropProperties {
	disabled?: boolean,
	/** Folder where to upload */
	targetFolder: IFolder
	/** Optional callback called after uploading files - even if disabled */
	callback?: (uploads: INode[]|Upload[]) => void
}

/**
 * Vue directive to handle uploading files on drop events.
 *
 * @param el The element where to bound to
 * @param bindings Directive bindings
 * @param bindings.modifiers Modifiers used on the component - e.g. ".stop"
 * @param bindings.value The value passed through the component
 */
const onFileDrop: DirectiveHook<HTMLElement, VNode | null, OnFileDropProperties | (() => Promise<OnFileDropProperties>)> = function(
	el,
	{
		modifiers,
		value,
	},
) {
	// We need to use `ondrop` instead of addEventListener as we have no reference to previous
	// event listener to remove it from the component
	el.ondrop = async (event: DragEvent) => {
		const dataTransfer = event.dataTransfer
		const options = typeof value === 'function' ? await value() : value

		logger.debug('Start handling drop', { options })

		// Skip any drop handling if disabled
		if (options.disabled) {
			logger.info('Drop is disabled', { event })
			return
		}

		// Stop the event if called with "v-on-file-drop.stop"
		if (modifiers.stop) {
			event.stopPropagation()
		}
		// Prevent default drop behavior if called with "v-on-file-drop.prevent"
		if (modifiers.prevent) {
			event.preventDefault()
		}
		// Skip handling if event was aborted by the user (clicking somewhere)
		if (event.button > 0) {
			logger.debug('Drop aborted by user')
			return options.callback?.([])
		}

		let result: INode[]|Upload[] = []
		const draggingStore = useDragAndDropStore()
		if (draggingStore.isDragging) {
			logger.debug('Internal files are being dragged')
			const filesStore = useFilesStore()
			const nodes = filesStore.getNodes(draggingStore.dragging)
			await onDropInternalFiles(
				nodes,
				options.targetFolder,
				event.ctrlKey,
			)
			result = nodes
		} else if (dataTransfer) {
			logger.debug('Dropped external files')
			const uploads = await onDropExternalFiles(
				dataTransfer,
				options.targetFolder,
			)
			result = uploads
		} else {
			logger.debug('Drag and drop: Neither internal files are being dropped nor a datatransfer is available', { event })
		}

		return options.callback?.(result)
	}
}

export default onFileDrop
