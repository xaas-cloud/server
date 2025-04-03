<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
namespace OC\User\Listeners;

use OC\User\Manager;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\User\Events\BeforeUserLoggedInEvent;
use OCP\User\Events\BeforeUserLoggedInWithCookieEvent;
use OCP\User\Events\BeforeUserLoggedOutEvent;
use OCP\User\Events\UserLoggedInEvent;
use OCP\User\Events\UserLoggedInWithCookieEvent;
use OCP\User\Events\UserLoggedOutEvent;

/**
 * Adapter for legacy hooks - listen to typed events and forwards as hooks.
 *
 * @template-implements IEventListener<BeforeUserLoggedInEvent|UserLoggedInEvent|BeforeUserLoggedInWithCookieEvent|UserLoggedInWithCookieEvent|BeforeUserLoggedOutEvent|UserLoggedOutEvent>
 */
class LegacyUserHooksAdapterListener implements IEventListener {

	public function __construct(
		private Manager $manager,
	) {
	}

	public function handle(Event $event): void {
		if ($event instanceof BeforeUserLoggedInEvent) {
			$this->manager->emit('\OC\User', 'preLogin', [
				$event->getUsername(),
				$event->getPassword(),
			]);
			\OC_Hook::emit('OC_User', 'pre_login', [
				'run' => true,
				'uid' => $event->getUsername(),
				'password' => $event->getPassword(),
			]);
		} elseif ($event instanceof UserLoggedInEvent) {
			$this->manager->emit('\OC\User', 'postLogin', [
				$event->getUser(),
				$event->getLoginName(),
				$event->getPassword(),
				$event->isTokenLogin(),
			]);
			\OC_Hook::emit('OC_User', 'post_login', [
				'run' => true,
				'uid' => $event->getUid(),
				'loginName' => $event->getLoginName(),
				'password' => $event->getPassword(),
				'isTokenLogin' => $event->isTokenLogin(),
			]);
		} elseif ($event instanceof BeforeUserLoggedInWithCookieEvent) {
			$this->manager->emit('\OC\User', 'preRememberedLogin', [$event->getUsername()]);
		} elseif ($event instanceof UserLoggedInWithCookieEvent) {
			$this->manager->emit('\OC\User', 'postRememberedLogin', [
				$event->getUser(),
				$event->getPassword(),
			]);
			\OC_Hook::emit('OC_User', 'post_login', [
				'run' => true,
				'uid' => $event->getUser()->getUID(),
				'password' => $event->getPassword(),
			]);
		} elseif ($event instanceof BeforeUserLoggedOutEvent) {
			$this->manager->emit('\OC\User', 'logout', [$event->getUser()]);
			\OC_Hook::emit('OC_User', 'logout', []);
		} elseif ($event instanceof UserLoggedOutEvent) {
			$this->manager->emit('\OC\User', 'postLogout', [$event->getUser()]);
		}
	}
}
