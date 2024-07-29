<?php

declare(strict_types = 1);

namespace Test\Files\Template;

use OCP\Files\Template\Field;
use OCP\Files\Template\FieldType;

class FieldTest extends \Test\TestCase {
	protected function setUp(): void {
		parent::setUp();
	}

	public function testJsonSerialize(): void {
		$field = new Field("name", "Nextcloud", FieldType::RichText);

		$this->assertJsonStringEqualsJsonString(
			json_encode($field->jsonSerialize()),
			json_encode([
				"index" => "name",
				"content" => "Nextcloud",
				"type" => "rich-text",
				"alias" => null,
				"id" => null,
				"tag" => null,
			])
		);
	}
}