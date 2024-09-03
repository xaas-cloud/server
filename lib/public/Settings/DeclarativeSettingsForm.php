<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCP\Settings;

/**
 * @psalm-import-type DeclarativeSettingsSectionType from IDeclarativeSettingsForm
 */
abstract class DeclarativeSettingsForm implements IDeclarativeSettingsForm {
	abstract public function getId(): string;

	abstract public function getPriority(): int;

	abstract public function getTitle(): string;

	abstract public function getDescription(): ?string;

	abstract public function getUserDocumentationURL(): ?string;

	/**
	 * @return DeclarativeSettingsSectionType
	 */
	abstract public function getSectionType(): string;

	abstract public function getSectionId(): string;

	/**
	 * @return list<IDeclarativeSettingsOption>
	 */
	abstract public function getOptions(): array;

	public function getSchema(): array {
		$fields = [];
		foreach ($this->getOptions() as $option) {
			$field = [
				'id' => $option->getId(),
				'title' => $option->getTitle(),
				'type' => $option->getType(),
				'default' => $option->getDefault(),
			];

			$description = $option->getDescription();
			if ($description !== null) {
				$field['description'] = $description;
			}

			$placeholder = $option->getPlaceholder();
			if ($placeholder !== null) {
				$field['placeholder'] = $placeholder;
			}

			$label = $option->getLabel();
			if ($label !== null) {
				$field['label'] = $label;
			}

			$options = $option->getOptions();
			if ($options !== null) {
				$field['options'] = $options;
			}

			$fields[] = $field;
		}

		$form = [
			'id' => $this->getId(),
			'priority' => $this->getPriority(),
			'section_type' => $this->getSectionType(),
			'section_id' => $this->getSectionId(),
			'storage_type' => 'internal',
			'title' => $this->getTitle(),
			'fields' => $fields,
		];

		$description = $this->getDescription();
		if ($description !== null) {
			$form['description'] = $description;
		}

		$docUrl = $this->getUserDocumentationURL();
		if ($docUrl !== null) {
			$form['doc_url'] = $docUrl;
		}

		return $form;
	}
}
