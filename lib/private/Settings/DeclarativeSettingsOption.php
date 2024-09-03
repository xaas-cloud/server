<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OC\Settings;

use OC\AppFramework\Middleware\Security\Exceptions\NotAdminException;
use OCP\Common\Exception\NotFoundException;
use OCP\IUser;
use OCP\IUserSession;
use OCP\Server;
use OCP\Settings\DeclarativeSettingsForm;
use OCP\Settings\IDeclarativeManager;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

class DeclarativeSettingsOption {
	private ?IUser $user = null;
	private ?IDeclarativeManager $manager = null;

	public function __construct(
		public string $appName,
		public DeclarativeSettingsForm $form,
		public string $id,
	) {
	}

	/**
	 * @throws ContainerExceptionInterface
	 * @throws NotFoundExceptionInterface
	 * @throws NotFoundException
	 */
	private function getUser(): IUser {
		if ($this->user === null) {
			$userSession = Server::get(IUserSession::class);
			$this->user = $userSession->getUser();
			if ($this->user === null) {
				throw new NotFoundException('User not found');
			}
		}

		return $this->user;
	}

	/**
	 * @throws ContainerExceptionInterface
	 * @throws NotFoundExceptionInterface
	 */
	private function getDeclarativeManager(): IDeclarativeManager {
		if ($this->manager === null) {
			$this->manager = Server::get(IDeclarativeManager::class);
		}

		$this->manager->loadSchemas();
		return $this->manager;
	}

	/**
	 * @throws NotAdminException
	 * @throws NotFoundExceptionInterface
	 * @throws NotFoundException
	 * @throws ContainerExceptionInterface
	 */
	public function setValue(mixed $value): void {
		$this->getDeclarativeManager()->setValue(
			$this->getUser(),
			$this->appName,
			$this->form->getId(),
			$this->id,
			$value,
		);
	}

	/**
	 * @throws NotAdminException
	 * @throws NotFoundExceptionInterface
	 * @throws NotFoundException
	 * @throws ContainerExceptionInterface
	 */
	public function getValue(): mixed {
		return $this->getDeclarativeManager()->getValue(
			$this->getUser(),
			$this->appName,
			$this->form->getId(),
			$this->id,
		);
	}

	/**
	 * @throws NotAdminException
	 * @throws NotFoundExceptionInterface
	 * @throws NotFoundException
	 * @throws ContainerExceptionInterface
	 */
	public function deleteValue(): void {
		$this->getDeclarativeManager()->deleteValue(
			$this->getUser(),
			$this->appName,
			$this->form->getId(),
			$this->id,
		);
	}
}
