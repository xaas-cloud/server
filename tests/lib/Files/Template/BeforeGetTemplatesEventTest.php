<?php

declare(strict_types = 1);

namespace Test\Files\Template;

use OCP\Files\File;
use OCP\Files\Template\BeforeGetTemplatesEvent;
use OCP\Files\Template\Template;

class BeforeGetTemplatesEventTest extends \Test\TestCase {
	protected BeforeGetTemplatesEvent $event;

	protected function setUp(): void {
		parent::setUp();

		$this->event = new BeforeGetTemplatesEvent([
			new Template("document", "template1", $this->createMock(File::class)),
		]);
	}

	public function testGetEventTemplates(): void {
		// TODO: implement tests for this class
	}
}
