<?php

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare(strict_types=1);

namespace OCA\Sharing;

use OCA\Sharing\Exception\ShareCreationNotAllowedException;
use OCA\Sharing\Exception\ShareDeletionNotAllowedException;
use OCA\Sharing\Exception\ShareInvalidException;
use OCA\Sharing\Exception\ShareInvalidRecipientSearchParametersException;
use OCA\Sharing\Exception\ShareNotFoundException;
use OCA\Sharing\Exception\ShareUpdateNotAllowedException;
use OCA\Sharing\Model\AShareRecipientType;
use OCA\Sharing\Model\Share;
use OCP\DB\Exception;
use OCP\IDBConnection;
use OCP\IUser;
use OCP\IUserManager;
use OCP\Server;
use Sabre\VObject\UUIDUtil;

class Manager {
	public function __construct(
		private readonly IDBConnection $connection,
		private readonly Registry $registry,
	) {
	}

	/**
	 * @param class-string<AShareRecipientType> $recipientType
	 * @param non-empty-string $query
	 * @param int<1, 100> $limit
	 * @param non-negative-int $offset
	 * @return list<string>
	 * @throws ShareInvalidRecipientSearchParametersException
	 */
	public function searchRecipients(string $recipientType, string $query, int $limit, int $offset): array {
		/** @psalm-suppress TypeDoesNotContainType */
		if ($query === '') {
			throw new ShareInvalidRecipientSearchParametersException('query');
		}

		/** @psalm-suppress DocblockTypeContradiction */
		if ($limit < 1 || $limit > 100) {
			throw new ShareInvalidRecipientSearchParametersException('limit');
		}

		/** @psalm-suppress DocblockTypeContradiction */
		if ($offset < 0) {
			throw new ShareInvalidRecipientSearchParametersException('offset');
		}

		$recipientTypes = $this->registry->getRecipientTypes();
		if (!isset($recipientTypes[$recipientType])) {
			throw new ShareInvalidRecipientSearchParametersException('recipientType');
		}

		return $recipientTypes[$recipientType]->searchRecipients($query, $limit, $offset);
	}

	/**
	 * @throws ShareInvalidException
	 */
	public function validate(Share $share): void {
		if (!UUIDUtil::validateUUID($share->id)) {
			throw new ShareInvalidException($share, 'The ID is not a valid UUID.');
		}

		$creator = Server::get(IUserManager::class)->get($share->creator);
		if ($creator === null) {
			throw new ShareInvalidException($share, 'The creator does not exist.');
		}

		$sourceTypes = $this->registry->getSourceTypes();
		if (!isset($sourceTypes[$share->sourceType])) {
			throw new ShareInvalidException($share, 'The source type is not registered.');
		}
		$sourceType = $sourceTypes[$share->sourceType];
		if ($share->sources === []) {
			throw new ShareInvalidException($share, 'The sources are missing.');
		}
		foreach ($share->sources as $source) {
			if (!$sourceType->validateSource($creator, $source)) {
				throw new ShareInvalidException($share, 'The source ' . $source . ' is not valid.');
			}
		}

		$recipientTypes = $this->registry->getRecipientTypes();
		if (!isset($recipientTypes[$share->recipientType])) {
			throw new ShareInvalidException($share, 'The recipient type is not registered.');
		}
		$recipientType = $recipientTypes[$share->recipientType];
		if ($share->recipients === []) {
			throw new ShareInvalidException($share, 'The recipients are missing.');
		}
		foreach ($share->recipients as $recipient) {
			if (!$recipientType->validateRecipient($creator, $recipient)) {
				throw new ShareInvalidException($share, 'The recipient ' . $recipient . ' is not valid.');
			}
		}

		// TODO validate properties
	}

	/**
	 * @throws ShareCreationNotAllowedException
	 * @throws ShareInvalidException
	 */
	public function insert(IUser $user, Share $share): void {
		$this->validate($share);

		if ($share->creator !== $user->getUID()) {
			throw new ShareCreationNotAllowedException($user, $share->creator);
		}

		$this->connection->beginTransaction();

		$qb = $this->connection->getQueryBuilder();
		$qb
			->insert('sharing_share')
			->values([
				'id' => $qb->createNamedParameter($share->id),
				'creator' => $qb->createNamedParameter($share->creator),
				'source_type' => $qb->createNamedParameter($share->sourceType),
				'recipient_type' => $qb->createNamedParameter($share->recipientType),
			])
			->executeStatement();

		$this->insertSources($share);
		$this->insertRecipients($share);
		$this->insertProperties($share);

		try {
			$this->connection->commit();
		} catch (Exception $e) {
			$this->connection->rollBack();
			throw $e;
		}
	}

	private function insertSources(Share $share): void {
		$qb = $this->connection->getQueryBuilder()
			->insert('sharing_share_sources');
		foreach ($share->sources as $source) {
			$qb
				->values([
					'share_id' => $qb->createNamedParameter($share->id),
					'source' => $qb->createNamedParameter($source),
				])
				->executeStatement();
		}
	}

	private function insertRecipients(Share $share): void {
		$qb = $this->connection->getQueryBuilder()
			->insert('sharing_share_recipients');
		foreach ($share->recipients as $recipient) {
			$qb
				->values([
					'share_id' => $qb->createNamedParameter($share->id),
					'recipient' => $qb->createNamedParameter($recipient),
				])
				->executeStatement();
		}
	}

	private function insertProperties(Share $share): void {
		$qb = $this->connection->getQueryBuilder()
			->insert('sharing_share_properties');
		foreach ($share->properties as $property) {
			$property = $property->toArray();
			$property['share_id'] = $share->id;
			$qb
				->values(array_map($qb->createNamedParameter(...), $property))
				->executeStatement();
		}
	}

	/**
	 * @throws ShareNotFoundException
	 * @throws ShareInvalidException
	 * @throws ShareUpdateNotAllowedException
	 */
	public function update(IUser $user, Share $share): void {
		$this->validate($share);

		$originalShare = $this->get($user, $share->id);
		if ($originalShare->creator !== $user->getUID()) {
			throw new ShareUpdateNotAllowedException($user, $originalShare->creator);
		}

		if ($originalShare->creator !== $share->creator) {
			throw new ShareInvalidException($share, 'creator');
		}

		if ($originalShare->sourceType !== $share->sourceType) {
			throw new ShareInvalidException($share, 'sourceType');
		}

		if ($originalShare->recipientType !== $share->recipientType) {
			throw new ShareInvalidException($share, 'recipientType');
		}

		$this->connection->beginTransaction();

		$this->deleteSources($share->id);
		$this->insertSources($share);

		$this->deleteRecipients($share->id);
		$this->insertRecipients($share);

		$this->deleteProperties($share->id);
		$this->insertProperties($share);

		try {
			$this->connection->commit();
		} catch (Exception $e) {
			$this->connection->rollBack();
			throw $e;
		}
	}

	/**
	 * @throws ShareNotFoundException
	 * @throws ShareDeletionNotAllowedException
	 */
	public function delete(IUser $user, string $shareID): void {
		$originalShare = $this->get($user, $shareID);
		if ($originalShare->creator !== $user->getUID()) {
			throw new ShareDeletionNotAllowedException($user, $originalShare->creator);
		}

		$this->connection->beginTransaction();

		$qb = $this->connection->getQueryBuilder();
		$qb
			->delete('sharing_share')
			->where($qb->expr()->eq('id', $qb->createNamedParameter($shareID)))
			->executeStatement();

		$this->deleteSources($shareID);
		$this->deleteRecipients($shareID);
		$this->deleteProperties($shareID);

		try {
			$this->connection->commit();
		} catch (Exception $e) {
			$this->connection->rollBack();
			throw $e;
		}
	}

	private function deleteSources(string $shareID): void {
		$qb = $this->connection->getQueryBuilder();
		$qb
			->delete('sharing_share_sources')
			->where($qb->expr()->eq('share_id', $qb->createNamedParameter($shareID)))
			->executeStatement();
	}

	private function deleteRecipients(string $shareID): void {
		$qb = $this->connection->getQueryBuilder();
		$qb
			->delete('sharing_share_recipients')
			->where($qb->expr()->eq('share_id', $qb->createNamedParameter($shareID)))
			->executeStatement();
	}

	private function deleteProperties(string $shareID): void {
		$qb = $this->connection->getQueryBuilder();
		$qb
			->delete('sharing_share_properties')
			->where($qb->expr()->eq('share_id', $qb->createNamedParameter($shareID)))
			->executeStatement();
	}

	/**
	 * @throws ShareNotFoundException
	 */
	public function get(IUser $user, string $shareID): Share {
		$shares = $this->internalList($user, $shareID);
		if (count($shares) !== 1) {
			throw new ShareNotFoundException($user, $shareID);
		}

		return $shares[0];
	}

	/**
	 * @return list<Share>
	 */
	public function list(IUser $user): array {
		return $this->internalList($user, null);
	}

	/**
	 * @return list<Share>
	 */
	private function internalList(IUser $user, ?string $shareID): array {
		$qb = $this->connection->getQueryBuilder();
		$qb
			->select('*')
			->from('sharing_share', 's')
			->leftJoin('s', 'sharing_share_sources', 'ss', $qb->expr()->eq('s.id', 'ss.share_id'))
			->leftJoin('s', 'sharing_share_recipients', 'sr', $qb->expr()->eq('s.id', 'sr.share_id'))
			->leftJoin('s', 'sharing_share_properties', 'sp', $qb->expr()->eq('s.id', 'sp.share_id'))
			->where($qb->expr()->eq('s.creator', $qb->createNamedParameter($user->getUID())));

		if ($shareID !== null) {
			$qb->andWhere($qb->expr()->eq('s.id', $qb->createNamedParameter($shareID)));
		}

		// TODO: Filter by recipient
		// TODO: Filter by source type
		// TODO: Filter by features (e.g. expiration date)

		$shares = [];
		$result = $qb->executeQuery();
		/** @var array<string, mixed> $row */
		foreach ($result->fetchAll() as $row) {
			$id = (string)$row['id'];

			$shares[$id] ??= [
				'id' => $id,
				'creator' => (string)$row['creator'],
				'source_type' => (string)$row['source_type'],
				'sources' => [],
				'recipient_type' => (string)$row['recipient_type'],
				'recipients' => [],
				'properties' => [],
			];

			if ($row['source'] !== null) {
				$shares[$id]['sources'][] = (string)$row['source'];
			}

			if ($row['recipient'] !== null) {
				$shares[$id]['recipients'][] = (string)$row['recipient'];
			}

			if ($row['feature'] !== null) {
				$shares[$id]['properties'][] = [
					'feature' => (string)$row['feature'],
					'key' => (string)$row['key'],
					'value' => (string)$row['value'],
				];
			}
		}
		$result->closeCursor();

		/** @psalm-suppress ArgumentTypeCoercion */
		return array_map(static fn (array $share) => Share::fromArray($share), array_values($shares));
	}
}
