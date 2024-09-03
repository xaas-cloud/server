<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCP\Settings;

/**
 * @psalm-import-type DeclarativeSettingsFormFieldType from IDeclarativeSettingsForm
 * @psalm-import-type DeclarativeSettingsFormFieldOptions from IDeclarativeSettingsForm
 */
interface IDeclarativeSettingsOption {
	public function getId(): string;

	public function getTitle(): string;

	public function getDescription(): ?string;

	/**
	 * @return DeclarativeSettingsFormFieldType
	 */
	public function getType(): string;

	public function getPlaceholder(): ?string;

	public function getLabel(): ?string;

	public function getDefault(): mixed;

	/**
	 * @return DeclarativeSettingsFormFieldOptions
	 */
	public function getOptions(): mixed;
}
