<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCP\Settings\Events;

use OCP\EventDispatcher\Event;
use OCP\IUser;

/**
 * @since 31.0.0
 */
class DeclarativeSettingsDeleteValueEvent extends Event {
	/**
	 * @since 31.0.0
	 */
	public function __construct(
		private IUser $user,
		private string $app,
		private string $formId,
		private string $fieldId,
	) {
		parent::__construct();
	}

	/**
	 * @since 31.0.0
	 */
	public function getUser(): IUser {
		return $this->user;
	}

	/**
	 * @since 31.0.0
	 */
	public function getApp(): string {
		return $this->app;
	}

	/**
	 * @since 31.0.0
	 */
	public function getFormId(): string {
		return $this->formId;
	}

	/**
	 * @since 31.0.0
	 */
	public function getFieldId(): string {
		return $this->fieldId;
	}
}
