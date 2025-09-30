<?php

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare(strict_types=1);

namespace OCA\Sharing\Model;

use OCA\Sharing\ResponseDefinitions;

/**
 * @psalm-import-type SharingShareProperty from ResponseDefinitions
 */
class ShareProperty {
	public function __construct(
		/** @var class-string<AShareFeature> $feature */
		public readonly string $feature,
		/** @var non-empty-string $key */
		public readonly string $key,
		public readonly string $value,
	) {
	}

	/**
	 * @param SharingShareProperty $data
	 */
	public static function fromArray(array $data): self {
		return new self(
			$data['feature'],
			$data['key'],
			$data['value'],
		);
	}

	/**
	 * @return SharingShareProperty
	 */
	public function toArray(): array {
		return [
			'feature' => $this->feature,
			'key' => $this->key,
			'value' => $this->value,
		];
	}
}
