<?php

declare(strict_types=1);
/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Testing\Settings;

use OCA\Testing\AppInfo\Application;
use OCP\Settings\DeclarativeSettingsForm;
use OCP\Settings\DeclarativeSettingsOptionInt;
use OCP\Settings\DeclarativeSettingsTypes;

class DeclarativeSettingsFormTyped extends DeclarativeSettingsForm {
	public DeclarativeSettingsOptionInt $test;

	public function __construct() {
		$this->test = new DeclarativeSettingsOptionInt(
			appName: Application::APP_ID,
			form: $this,
			id: 'test_ex_app_field_8',
			title: 'Multi-selection',
			default: 2,
			options: [1, 2, 3, 5],
			description: 'Select some option setting',
			placeholder: 'Select some multiple options',
		);
	}

	public function getId(): string {
		return 'test_declarative_form_typed';
	}

	public function getPriority(): int {
		return 10;
	}

	public function getTitle(): string {
		return 'Test declarative settings class typed';
	}

	public function getDescription(): ?string {
		return 'This form is registered with a DeclarativeSettingsForm class';
	}

	public function getUserDocumentationURL(): ?string {
		return null;
	}


	public function getSectionType(): string {
		return DeclarativeSettingsTypes::SECTION_TYPE_ADMIN;
	}

	public function getSectionId(): string {
		return 'additional';
	}

	public function getOptions(): array {
		return [
			$this->test,
		];
	}
}
