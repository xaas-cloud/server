/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import type { FileStat, ResponseDataDetailed } from 'webdav'

import { emit } from '@nextcloud/event-bus'
import { Folder, Node, davGetClient, davGetDefaultPropfind, davResultToNode, getNavigation, Permission } from '@nextcloud/files'
import { getConflicts, openConflictPicker, type IDirectory } from '@nextcloud/upload'
import { showError, showInfo } from '@nextcloud/dialogs'
import { translate as t } from '@nextcloud/l10n'
import logger from '../logger.ts'

export const createDirectoryIfNotExists = async (absolutePath: string) => {
	const davClient = davGetClient()
	const dirExists = await davClient.exists(absolutePath)
	if (!dirExists) {
		logger.debug('Directory does not exist, creating it', { absolutePath })
		await davClient.createDirectory(absolutePath, { recursive: true })
		const stat = await davClient.stat(absolutePath, { details: true, data: davGetDefaultPropfind() }) as ResponseDataDetailed<FileStat>
		emit('files:node:created', davResultToNode(stat.data))
	}
}

/**
 * Helper function to resolve conflicts when using batchUpload from `@nextcloud/upload`
 * @param files Files that are going to be uploaded
 * @param currentPath The path where the files are uploaded to
 */
export async function resolveUploadConflicts(files: Array<IDirectory|File>, currentPath: string): Promise<Array<IDirectory|File>> {
	const view = getNavigation().active!
	try {
		const { contents, folder } = await view.getContents(currentPath)
		return await resolveConflict(files, folder, contents)
	} catch (error) {
		// If the folder does not exist then we can upload everything
		logger.debug('Could not fetch folder with contents.', { error, currentPath })
	}
	return files
}

/**
 * Resolve conflicts on dropping files
 * @param files Files to be uploaded
 * @param destination The current folder to upload to
 * @param contents The content of the folder
 */
export async function resolveConflict<T extends((IDirectory|File)|Node)>(files: Array<T>, destination: Folder, contents: Node[]): Promise<T[]> {
	// No permissions
	if (!(destination.permissions & Permission.CREATE)) {
		return []
	}

	try {
		const conflicts = getConflicts(files, contents)
		// No conflicts thus upload all
		if (conflicts.length === 0) {
			return files
		}

		// List of incoming files that are NOT in conflict
		const uploads = files.filter((file: File|Node) => {
			return !(conflicts as unknown[]).includes(file)
		})

		logger.debug('Starting conflict resolution', { path: destination.path, conflicts, contents })

		// Let the user choose what to do with the conflicting files
		const { selected, renamed } = await openConflictPicker(destination.path, conflicts, contents, { recursive: true })

		logger.debug('Conflict resolution', { uploads, selected, renamed })

		// If the user selected nothing, we cancel the upload
		if (selected.length === 0 && renamed.length === 0) {
			// User skipped
			showInfo(t('files', 'Conflicts resolution skipped'))
			logger.info('User skipped the conflict resolution')
			return []
		}

		// Update the list of files to upload
		return [...uploads, ...selected, ...renamed] as (typeof files)
	} catch (error) {
		logger.error('User cancelled the upload', { error })
		// User cancelled
		showError(t('files', 'Upload cancelled'))
	}

	return []
}
