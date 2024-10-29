/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Upload } from '@nextcloud/upload'

import { Folder, Node, NodeStatus } from '@nextcloud/files'
import { getUploader, hasConflict } from '@nextcloud/upload'
import { showError, showInfo, showSuccess, showWarning } from '@nextcloud/dialogs'
import { translate as t } from '@nextcloud/l10n'
import Vue from 'vue'

import { resolveConflict } from './DropServiceUtils'
import { handleCopyMoveNodeTo } from '../actions/moveOrCopyAction'
import { MoveCopyAction } from '../actions/moveOrCopyActionUtils'
import logger from '../logger.ts'

/**
 * This function converts a list of DataTransferItems to a file tree.
 * It uses the Filesystem API if available, otherwise it falls back to the File API.
 * The File API will NOT be available if the browser is not in a secure context (e.g. HTTP).
 * ⚠️ When using this method, you need to use it as fast as possible, as the DataTransferItems
 * will be cleared after the first access to the props of one of the entries.
 *
 * @param items the list of DataTransferItems
 */
export async function onDropExternalFiles(items: DataTransferItem[]): Promise<Upload[]> {
	// Check if the browser supports the Filesystem API
	// We need to cache the entries to prevent Blink engine bug that clears
	// the list (`data.items`) after first access props of one of the entries
	const entries = items
		.filter((item) => {
			if (item.kind !== 'file') {
				logger.debug('Skipping dropped item', { kind: item.kind, type: item.type })
				return false
			}
			return true
		}).map((item) => {
			// MDN recommends to try both, as it might be renamed in the future
			return (item as unknown as DataTransferItem & { getAsEntry?: () => FileSystemEntry|undefined }).getAsEntry?.()
				?? item.webkitGetAsEntry?.()
				?? item.getAsFile()
		}).filter((item: FileSystemEntry | File | null) => {
			if (item === null) {
				showWarning(t('files', 'One of the dropped files could not be processed'))
				return false
			}
			return true
		}) as (FileSystemEntry | File)[]

	if (entries.length === 0) {
		logger.info('No valid files were dropped.')
		return []
	}

	// Get the uploader and start the batch upload
	const uploader = getUploader()

	try {
		uploader.pause()
		const promise = uploader.batchUpload('', entries)
		uploader.start()

		const uploads = await promise
		logger.debug('Files uploaded successfully', { uploads })
		showSuccess(t('files', 'Files uploaded successfully'))
		return uploads
	} catch (error) {
		logger.error('Error while uploading files', { error })
		showError(t('files', 'Some files could not be uploaded'))
		return []
	}
}

export const onDropInternalFiles = async (nodes: Node[], destination: Folder, contents: Node[], isCopy = false) => {
	const queue = [] as Promise<void>[]

	// Check for conflicts on root elements
	if (await hasConflict(nodes, contents)) {
		nodes = await resolveConflict(nodes, destination, contents)
	}

	if (nodes.length === 0) {
		logger.info('No files to process', { nodes })
		showInfo(t('files', 'No files to process'))
		return
	}

	for (const node of nodes) {
		Vue.set(node, 'status', NodeStatus.LOADING)
		queue.push(handleCopyMoveNodeTo(node, destination, isCopy ? MoveCopyAction.COPY : MoveCopyAction.MOVE, true))
	}

	// Wait for all promises to settle
	const results = await Promise.allSettled(queue)
	nodes.forEach(node => Vue.set(node, 'status', undefined))

	// Check for errors
	const errors = results.filter(result => result.status === 'rejected')
	if (errors.length > 0) {
		logger.error('Error while copying or moving files', { errors })
		showError(isCopy ? t('files', 'Some files could not be copied') : t('files', 'Some files could not be moved'))
		return
	}

	logger.debug('Files copy/move successful')
	showSuccess(isCopy ? t('files', 'Files copied successfully') : t('files', 'Files moved successfully'))
}
