<?php

namespace OCA\Testing\Controller;

use OCA\Testing\Settings\DeclarativeSettingsFormTyped;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Attribute\FrontpageRoute;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IRequest;

class PageController extends Controller {
	public function __construct(
		string $appName,
		IRequest $request,
		private DeclarativeSettingsFormTyped $form,
	) {
		parent::__construct($appName, $request);
	}

	#[NoAdminRequired]
	#[NoCSRFRequired]
	#[FrontpageRoute(verb: 'GET', url: '/declarative-settings-typed')]
	public function declarativeSettingsTyped(): JSONResponse {
		$this->form->test->setValue(1);
		$value1 = $this->form->test->getValue();
		$this->form->test->setValue(8);
		$value2 = $this->form->test->getValue();
		$this->form->test->deleteValue();
		$value3 = $this->form->test->getValue();
		return new JSONResponse([
			'value1' => $value1,
			'value2' => $value2,
			'value3' => $value3,
		]);
	}
}
