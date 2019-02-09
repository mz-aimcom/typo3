<?php
declare(strict_types = 1);

namespace TYPO3\CMS\Frontend\Tests\Functional\SiteHandling\LocalizedPageRendering;

/*
 * This file is part of the TYPO3 CMS project.
 *
 * It is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License, either version 2
 * of the License, or any later version.
 *
 * For the full copyright and license information, please read the
 * LICENSE.txt file that was distributed with this source code.
 *
 * The TYPO3 project - inspiring people to share!
 */

use TYPO3\CMS\Core\Error\Http\PageNotFoundException;

/**
 * Scenario prerequisites:
 *   Site configuration has localizations
 *     default language: EN
 *     first language: DE
 *       no fallbacks configured
 *     second language: DE-CH
 *       fallback to DE, EN
 *
 *   Home page is not localized into any language and has l18n_cfg=1 set
 *   "About" page is localized into DE and has l18n_cfg=1 set
 *   "Products" page is localized into DE and has l18n_cfg=1 set
 *
 * Scenario expectations:
 *   Calling home page in EN throws a PageNotFoundException due to l18n_cfg=1
 *   Calling home page in DE throws a PageNotFoundException
 *   Calling home page in DE-CH throws a PageNotFoundException because EN is used as fallback but is not processed due to l18n_cfg=1
 *
 *   Calling "about" page in EN throws a PageNotFoundException due to l18n_cfg=1
 *   Calling "about" page in DE renders page in DE
 *   Calling "about" page in DE-CH renders page in DE
 *   Calling "about" page in DE with EN slug throws a PageNotFoundException
 *   Calling "about" page in DE-CH with EN slug renders page in DE
 */
class ScenarioETest extends AbstractLocalizedPagesTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->writeSiteConfiguration(
            'acme-com',
            $this->buildSiteConfiguration(1000, 'https://acme.com/'),
            [
                $this->buildDefaultLanguageConfiguration('EN', 'https://acme.com/en'),
                $this->buildLanguageConfiguration('DE', 'https://acme.com/de'),
                $this->buildLanguageConfiguration('DE-CH', 'https://acme.com/de-ch', ['DE', 'EN']),
            ]
        );

        $this->setUpDatabaseWithYamlPayload(__DIR__ . '/Fixtures/ScenarioE.yaml');
    }

    /**
     * @return array
     */
    public function resolvablePagesDataProvider(): array
    {
        return [
            'about page in DE where page translation exists' => [
                'url' => 'https://acme.com/de/ueber-uns',
                'scopes' => [
                    'page/title' => 'DE: Über uns',
                ],
            ],
            'about page in DE-CH where page translation does not exist' => [
                'url' => 'https://acme.com/de-ch/ueber-uns',
                'scopes' => [
                    'page/title' => 'DE: Über uns',
                ],
            ],
            'about page in DE-CH with EN slug' => [
                'url' => 'https://acme.com/de-ch/about-us',
                'scopes' => [
                    'page/title' => 'DE: Über uns',
                ],
            ],
        ];
    }

    /**
     * @param string $url
     * @param array $scopes
     *
     * @test
     * @dataProvider resolvablePagesDataProvider
     */
    public function resolvedPagesMatchScopes(string $url, array $scopes): void
    {
        $this->assertScopes($url, $scopes);
    }

    /**
     * @return array
     */
    public function pageNotFoundDataProvider(): array
    {
        return [
            'home page in EN' => [
                'url' => 'https://acme.com/en/hello',
                'exception' => PageNotFoundException::class,
            ],
            'home page in DE where page translation does not exist' => [
                'url' => 'https://acme.com/de/hello',
                'exception' => PageNotFoundException::class,
            ],
            'home page in DE-CH where page translation does not exist and is trapped by l18n_cfg' => [
                'url' => 'https://acme.com/de-ch/hello',
                'exception' => PageNotFoundException::class,
            ],
            'about page in EN' => [
                'url' => 'https://acme.com/en/about-us',
                'exception' => PageNotFoundException::class,
            ],
            'about page in DE with EN slug' => [
                'url' => 'https://acme.com/de/about-us',
                'exception' => PageNotFoundException::class,
            ],
        ];
    }

    /**
     * @param string $url
     * @param string $exception
     *
     * @test
     * @dataProvider pageNotFoundDataProvider
     */
    public function requestsThrowException(string $url, string $exception): void
    {
        $this->assertException($url, $exception);
    }

    /**
     * @return array
     */
    public function menuDataProvider(): array
    {
        return [
            [
                'url' => 'https://acme.com/de/ueber-uns',
                'menu' => [
                    ['title' => 'DE: Über uns', 'link' => '/de/ueber-uns'],
                    ['title' => 'DE: Produkte', 'link' => '/de/produkte'],
                ],
            ],
            [
                'url' => 'https://acme.com/de-ch/ueber-uns',
                'menu' => [
                    ['title' => 'DE: Über uns', 'link' => '/de-ch/ueber-uns'],
                    ['title' => 'DE: Produkte', 'link' => '/de-ch/produkte'],
                    // FIXME: Page "EN: Shortcut to welcome" must to be rendered in menu, needs a refactored menu generation
                    ['title' => 'EN: Shortcut to welcome', 'link' => ''],
                ],
            ],
            [
                'url' => 'https://acme.com/de-ch/about-us',
                'menu' => [
                    ['title' => 'DE: Über uns', 'link' => '/de-ch/ueber-uns'],
                    ['title' => 'DE: Produkte', 'link' => '/de-ch/produkte'],
                    // FIXME: Page "EN: Shortcut to welcome" must to be rendered in menu, needs a refactored menu generation
                    ['title' => 'EN: Shortcut to welcome', 'link' => ''],
                ],
            ],
        ];
    }

    /**
     * @param string $url
     * @param array $expectedMenu
     *
     * @test
     * @dataProvider menuDataProvider
     */
    public function pageMenuIsRendered(string $url, array $expectedMenu): void
    {
        $this->assertMenu($url, $expectedMenu);
    }
}
