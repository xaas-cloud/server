<?php

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare(strict_types=1);

namespace OCA\Sharing;

use OCA\Sharing\Model\AShareFeature;
use OCA\Sharing\Model\AShareRecipientType;
use OCA\Sharing\Model\AShareSourceType;

/**
 * @psalm-type SharingShareProperty = array{
 *     feature: class-string<AShareFeature>,
 *     key: non-empty-string,
 *     value: string,
 * }
 *
 * @psalm-type SharingShare = array{
 *     // UUID
 *     id: non-empty-string,
 *     // User ID
 *     creator: non-empty-string,
 *     source_type: class-string<AShareSourceType>,
 *     sources: list<string>,
 *     recipient_type: class-string<AShareRecipientType>,
 *     recipients: list<string>,
 *     properties: list<SharingShareProperty>,
 * }
 *
 * @psalm-type SharingCompatible = array{
 *     source_type: class-string<AShareSourceType>,
 *     recipient_type: class-string<AShareRecipientType>,
 * }
 *
 * @psalm-type SharingFeature = array{
 *     compatibles: list<SharingCompatible>,
 * }
 */
class ResponseDefinitions {
}
