<?php

namespace OCA\Sharing\Features;

use OCA\Sharing\Model\AShareFeature;
use OCA\Sharing\RecipientTypes\GroupShareRecipientType;
use OCA\Sharing\RecipientTypes\UserShareRecipientType;
use OCA\Sharing\SourceTypes\NodeShareSourceType;

class ExpirationShareFeature extends AShareFeature {
	public function getID(): string {
		return 'expiration';
	}

	public function getCompatibles(): array {
		return [
			[
				'source_type' => NodeShareSourceType::class,
				'recipient_type' => UserShareRecipientType::class,
			],
			[
				'source_type' => NodeShareSourceType::class,
				'recipient_type' => GroupShareRecipientType::class,
			],
		];
	}

	/*
	public function validate(): ?string {
		// TODO
		if (count($this->data) > 1) {
			return $this->getL10N()->t('Multiple expiration dates are not allowed.');
		}

		try {
			$expirationDate = new DateTimeImmutable($this->data[0]);
		} catch (Exception $e) {
			return $this->getL10N()->t('The expiration date is invalid.');
		}

		$now = new DateTimeImmutable();
		$diff = $expirationDate->diff($now);
		if ($diff->invert === 1) {
			return $this->getL10N()->t('The expiration date must not be in the past.');
		}

		return null;
	}
	*/
}
