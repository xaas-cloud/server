<?php

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare(strict_types=1);

namespace OCA\Sharing\Exception;

use OCP\IUser;

class ShareDeletionNotAllowedException extends ShareException {
	public function __construct(IUser $user, string $creator) {
		parent::__construct('Deleting a share with ' . $creator . ' as the creator is not allowed as ' . $user->getUID());
	}
}
