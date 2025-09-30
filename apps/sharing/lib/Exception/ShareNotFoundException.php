<?php

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare(strict_types=1);

namespace OCA\Sharing\Exception;

use OCP\IUser;

class ShareNotFoundException extends ShareException {
	public function __construct(IUser $user, string $shareID) {
		parent::__construct('User ' . $user->getUID() . ' has no access to the share ' . $shareID);
	}
}
