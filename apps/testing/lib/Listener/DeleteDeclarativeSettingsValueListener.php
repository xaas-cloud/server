<?php

declare(strict_types=1);
/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
namespace OCA\Testing\Listener;

use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\IConfig;
use OCP\Settings\Events\DeclarativeSettingsDeleteValueEvent;

/**
 * @template-implements IEventListener<DeclarativeSettingsDeleteValueEvent>
 */
class DeleteDeclarativeSettingsValueListener implements IEventListener {

	public function __construct(private IConfig $config) {
	}

	public function handle(Event $event): void {
		if (!$event instanceof DeclarativeSettingsDeleteValueEvent) {
			return;
		}

		if ($event->getApp() !== 'testing') {
			return;
		}

		error_log('Testing app wants to delete field ' . $event->getFieldId() . ' for user ' . $event->getUser()->getUID());
		$this->config->deleteUserValue($event->getUser()->getUID(), $event->getApp(), $event->getFieldId());
	}
}
