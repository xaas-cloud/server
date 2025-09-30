<?php

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare(strict_types=1);

namespace OCA\Sharing\Exception;

use OCA\Sharing\Model\Share;

class ShareInvalidException extends ShareException {
	public function __construct(Share $share, string $message) {
		parent::__construct('Share ' . json_encode($share->toArray(), JSON_THROW_ON_ERROR) . ' is invalid: ' . $message);
	}
}
