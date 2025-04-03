<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
namespace OC\Authentication\Login;

use OCP\EventDispatcher\IEventDispatcher;
use OCP\User\Events\BeforeUserLoggedInEvent;

class BeforeUserLoggedInEventCommand extends ALoginCommand {

	public function __construct(
		private IEventDispatcher $dispatcher,
	) {
	}

	public function process(LoginData $loginData): LoginResult {
		$this->dispatcher->dispatchTyped(
			new BeforeUserLoggedInEvent(
				$loginData->getUsername(),
				$loginData->getPassword(),
			),
		);

		return $this->processNextOrFinishSuccessfully($loginData);
	}
}
