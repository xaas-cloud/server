<?php

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare(strict_types=1);

namespace OCA\Sharing\Tests\Controller;

use OCA\Sharing\Controller\ApiController;
use OCA\Sharing\Manager;
use OCA\Sharing\RecipientTypes\GroupShareRecipientType;
use OCA\Sharing\RecipientTypes\UserShareRecipientType;
use OCA\Sharing\Registry;
use OCA\Sharing\SourceTypes\NodeShareSourceType;
use OCP\AppFramework\Http;
use OCP\Files\IRootFolder;
use OCP\IGroup;
use OCP\IGroupManager;
use OCP\IUser;
use OCP\IUserManager;
use OCP\Server;
use Sabre\VObject\UUIDUtil;
use Test\TestCase;

/**
 * @group DB
 */
class ApiControllerTest extends TestCase {
	private Registry $registry;
	private IUser $user1;
	private IUser $user2;
	private IUser $user3;
	private IGroup $group1;
	private ApiController $controller;

	public function setUp(): void {
		parent::setUp();

		$this->registry = Server::get(Registry::class);
		$this->registry->clear();

		$this->user1 = Server::get(IUserManager::class)->createUser('user1', 'password');
		$this->user2 = Server::get(IUserManager::class)->createUser('user2', 'password');
		$this->user3 = Server::get(IUserManager::class)->createUser('user3', 'password');

		$this->group1 = Server::get(IGroupManager::class)->createGroup('group1');
		$this->group1->addUser($this->user1);

		self::loginAsUser($this->user1->getUID());

		$this->controller = Server::get(ApiController::class);
	}

	protected function tearDown(): void {
		$manager = Server::get(Manager::class);
		foreach ($manager->list($this->user1) as $share) {
			$manager->delete($this->user1, $share->id);
		}

		$this->user1->delete();
		$this->user2->delete();
		$this->user3->delete();
		$this->group1->delete();

		parent::tearDown();
	}

	public function testSearchRecipients(): void {
		$this->registry->registerRecipientType(new UserShareRecipientType());

		$response = $this->controller->searchRecipients(UserShareRecipientType::class, 'user');
		$this->assertEquals(Http::STATUS_OK, $response->getStatus());
		$this->assertEquals(['user1', 'user2', 'user3'], $response->getData());

		$response = $this->controller->searchRecipients(UserShareRecipientType::class, 'user', 1);
		$this->assertEquals(Http::STATUS_OK, $response->getStatus());
		$this->assertEquals(['user1'], $response->getData());

		$response = $this->controller->searchRecipients(UserShareRecipientType::class, 'user', offset: 1);
		$this->assertEquals(Http::STATUS_OK, $response->getStatus());
		$this->assertEquals(['user2', 'user3'], $response->getData());

		$response = $this->controller->searchRecipients(GroupShareRecipientType::class, 'group');
		$this->assertEquals(Http::STATUS_BAD_REQUEST, $response->getStatus());
		$this->assertEquals('Share recipient search parameters are invalid: recipientType', $response->getData());
	}

	public function testCreateShare(): void {
		$this->registry->registerSourceType(new NodeShareSourceType());
		$this->registry->registerRecipientType(new UserShareRecipientType());

		$sourceNode = Server::get(IRootFolder::class)->getUserFolder($this->user1->getUID())->newFile('foo.txt');
		$sourceNode->putContent('bar');

		$data = [
			'id' => UUIDUtil::getUUID(),
			'creator' => $this->user1->getUID(),
			'source_type' => NodeShareSourceType::class,
			'sources' => [(string)$sourceNode->getId()],
			'recipient_type' => UserShareRecipientType::class,
			'recipients' => [$this->user2->getUID()],
			'properties' => [],
		];
		$response = $this->controller->createShare($data);
		$this->assertEquals(Http::STATUS_CREATED, $response->getStatus());
		$this->assertEquals($data, $response->getData());
	}

	public function testGetShare(): void {
		$this->registry->registerSourceType(new NodeShareSourceType());
		$this->registry->registerRecipientType(new UserShareRecipientType());

		$sourceNode = Server::get(IRootFolder::class)->getUserFolder($this->user1->getUID())->newFile('foo.txt');
		$sourceNode->putContent('bar');

		$data = [
			'id' => UUIDUtil::getUUID(),
			'creator' => $this->user1->getUID(),
			'source_type' => NodeShareSourceType::class,
			'sources' => [(string)$sourceNode->getId()],
			'recipient_type' => UserShareRecipientType::class,
			'recipients' => [$this->user2->getUID()],
			'properties' => [],
		];
		$response = $this->controller->createShare($data);
		$this->assertEquals(Http::STATUS_CREATED, $response->getStatus());
		$this->assertEquals($data, $response->getData());

		$response = $this->controller->getShare($data['id']);
		$this->assertEquals(Http::STATUS_OK, $response->getStatus());
		$this->assertEquals($data, $response->getData());
	}

	public function testGetShares(): void {
		$this->registry->registerSourceType(new NodeShareSourceType());
		$this->registry->registerRecipientType(new UserShareRecipientType());

		$sourceNode = Server::get(IRootFolder::class)->getUserFolder($this->user1->getUID())->newFile('foo.txt');
		$sourceNode->putContent('bar');

		$data1 = [
			'id' => UUIDUtil::getUUID(),
			'creator' => $this->user1->getUID(),
			'source_type' => NodeShareSourceType::class,
			'sources' => [(string)$sourceNode->getId()],
			'recipient_type' => UserShareRecipientType::class,
			'recipients' => [$this->user2->getUID()],
			'properties' => [],
		];
		$response = $this->controller->createShare($data1);
		$this->assertEquals(Http::STATUS_CREATED, $response->getStatus());
		$this->assertEquals($data1, $response->getData());

		$data2 = [
			'id' => UUIDUtil::getUUID(),
			'creator' => $this->user1->getUID(),
			'source_type' => NodeShareSourceType::class,
			'sources' => [(string)$sourceNode->getId()],
			'recipient_type' => UserShareRecipientType::class,
			'recipients' => [$this->user2->getUID()],
			'properties' => [],
		];
		$response = $this->controller->createShare($data2);
		$this->assertEquals(Http::STATUS_CREATED, $response->getStatus());
		$this->assertEquals($data2, $response->getData());

		$response = $this->controller->getShares();
		$this->assertEquals(Http::STATUS_OK, $response->getStatus());
		$this->assertEquals([$data1, $data2], $response->getData());
	}

	public function testUpdateShare(): void {
		$this->registry->registerSourceType(new NodeShareSourceType());
		$this->registry->registerRecipientType(new UserShareRecipientType());

		$sourceNode = Server::get(IRootFolder::class)->getUserFolder($this->user1->getUID())->newFile('foo.txt');
		$sourceNode->putContent('bar');

		$data = [
			'id' => UUIDUtil::getUUID(),
			'creator' => $this->user1->getUID(),
			'source_type' => NodeShareSourceType::class,
			'sources' => [(string)$sourceNode->getId()],
			'recipient_type' => UserShareRecipientType::class,
			'recipients' => [$this->user2->getUID()],
			'properties' => [],
		];
		$response = $this->controller->createShare($data);
		$this->assertEquals(Http::STATUS_CREATED, $response->getStatus());
		$this->assertEquals($data, $response->getData());

		$sourceNode = Server::get(IRootFolder::class)->getUserFolder($this->user1->getUID())->newFile('bar.txt');
		$sourceNode->putContent('foo');

		$data['sources'] = [(string)$sourceNode->getId()];
		$data['recipients'] = [$this->user3->getUID()];
		$response = $this->controller->updateShare($data['id'], $data);
		$this->assertEquals(Http::STATUS_OK, $response->getStatus());
		$this->assertEquals($data, $response->getData());

		$response = $this->controller->getShare($data['id']);
		$this->assertEquals(Http::STATUS_OK, $response->getStatus());
		$this->assertEquals($data, $response->getData());
	}

	public function testDeleteShare(): void {
		$this->registry->registerSourceType(new NodeShareSourceType());
		$this->registry->registerRecipientType(new UserShareRecipientType());

		$sourceNode = Server::get(IRootFolder::class)->getUserFolder($this->user1->getUID())->newFile('foo.txt');
		$sourceNode->putContent('bar');

		$data = [
			'id' => UUIDUtil::getUUID(),
			'creator' => $this->user1->getUID(),
			'source_type' => NodeShareSourceType::class,
			'sources' => [(string)$sourceNode->getId()],
			'recipient_type' => UserShareRecipientType::class,
			'recipients' => [$this->user2->getUID()],
			'properties' => [],
		];
		$response = $this->controller->createShare($data);
		$this->assertEquals(Http::STATUS_CREATED, $response->getStatus());
		$this->assertEquals($data, $response->getData());

		$response = $this->controller->getShare($data['id']);
		$this->assertEquals(Http::STATUS_OK, $response->getStatus());
		$this->assertEquals($data, $response->getData());

		$response = $this->controller->deleteShare($data['id']);
		$this->assertEquals(Http::STATUS_NO_CONTENT, $response->getStatus());
		$this->assertEquals([], $response->getData());

		$response = $this->controller->getShare($data['id']);
		$this->assertEquals(Http::STATUS_NOT_FOUND, $response->getStatus());
		$this->assertEquals('User ' . $this->user1->getUID() . ' has no access to the share ' . $data['id'], $response->getData());
	}
}
