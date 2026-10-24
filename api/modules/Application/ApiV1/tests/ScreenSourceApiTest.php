<?php

namespace Origo\Application\ApiV1\Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Origo\Core\Project\Models\Project;
use Origo\Core\Screen\Models\Screen;
use Tests\TestCase;

class ScreenSourceApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Storage::fake('local');
        $this->actingAsProjectMember(Project::factory()->create(['code' => 'LMS']));
    }

    private function pngBytes(int $width, int $height): string
    {
        $image = imagecreatetruecolor($width, $height);
        ob_start();
        imagepng($image);

        return (string) ob_get_clean();
    }

    private function fakeRenderer(int $width = 1440, int $height = 2000): void
    {
        Http::fake(['origo-renderer:3000/render' => Http::response($this->pngBytes($width, $height), 200, ['Content-Type' => 'image/png'])]);
    }

    private function createFrom(array $source): TestResponse
    {
        return $this->post('/api/v1/projects/LMS/screens', ['name' => ['vi' => 'Giỏ hàng'], ...$source], ['Accept' => 'application/json']);
    }

    public function test_a_screen_is_captured_from_a_url_at_the_chosen_width(): void
    {
        $this->fakeRenderer(390, 1200);

        $this->createFrom(['url' => 'https://example.com/cart', 'width' => 390])->assertCreated();

        $screen = Screen::query()->firstOrFail();
        $this->assertSame(['url', 'https://example.com/cart', 390], [$screen->source_type, $screen->source_url, $screen->render_width]);
        $this->assertSame([390, 1200], [$screen->image_width, $screen->image_height]);
        Http::assertSent(fn (Request $request) => $request['kind'] === 'url' && $request['width'] === 390);
    }

    public function test_an_uploaded_html_page_is_packaged_rendered_and_kept_for_recapturing(): void
    {
        $this->fakeRenderer();

        $this->createFrom(['html' => UploadedFile::fake()->createWithContent('cart.html', '<h1>Giỏ</h1>')])->assertCreated();

        $screen = Screen::query()->firstOrFail();
        $this->assertSame('html', $screen->source_type);
        $this->assertSame(1440, $screen->render_width);
        Storage::disk('local')->assertExists($screen->source_path);
        Http::assertSent(fn (Request $request) => $request['entry'] === 'index.html' && base64_decode($request['files']['index.html']) === '<h1>Giỏ</h1>');
    }

    public function test_only_one_source_is_accepted_and_one_is_required(): void
    {
        $this->createFrom(['url' => 'https://example.com', 'image' => UploadedFile::fake()->image('a.png')])->assertUnprocessable();
        $this->createFrom([])->assertUnprocessable()->assertJsonValidationErrors('image');
        $this->createFrom(['url' => 'javascript:alert(1)'])->assertUnprocessable()->assertJsonValidationErrors('url');
        $this->createFrom(['url' => 'https://example.com', 'width' => 800])->assertUnprocessable()->assertJsonValidationErrors('width');
    }

    public function test_a_page_the_renderer_refuses_is_reported_and_creates_nothing(): void
    {
        Http::fake(['origo-renderer:3000/render' => Http::response(['error' => 'this address cannot be captured'], 422)]);

        $this->createFrom(['url' => 'http://10.0.0.5/'])->assertUnprocessable()->assertJsonValidationErrors('source');

        $this->assertDatabaseCount('screens', 0);
    }

    public function test_a_screen_from_a_url_can_be_captured_again(): void
    {
        Http::fake(['origo-renderer:3000/render' => Http::sequence()
            ->push($this->pngBytes(1440, 900), 200, ['Content-Type' => 'image/png'])
            ->push($this->pngBytes(1440, 1600), 200, ['Content-Type' => 'image/png'])]);
        $this->createFrom(['url' => 'https://example.com/cart'])->assertCreated();
        $screen = Screen::query()->firstOrFail();
        $firstImage = $screen->image_path;

        $this->postJson("/api/v1/projects/LMS/screens/{$screen->code}/recapture")->assertOk();

        $screen->refresh();
        $this->assertSame(1600, $screen->image_height);
        Storage::disk('public')->assertMissing($firstImage);
    }

    public function test_a_screen_from_an_image_cannot_be_captured_again(): void
    {
        $this->createFrom(['image' => UploadedFile::fake()->image('cart.png', 800, 500)])->assertCreated();

        $this->postJson('/api/v1/projects/LMS/screens/SC-01/recapture')->assertUnprocessable()->assertJsonValidationErrors('source');
    }

    public function test_switching_a_screen_from_html_to_an_image_drops_the_stored_page(): void
    {
        $this->fakeRenderer();
        $this->createFrom(['html' => UploadedFile::fake()->createWithContent('cart.html', '<h1>Giỏ</h1>')])->assertCreated();
        $sourcePath = Screen::query()->firstOrFail()->source_path;

        $this->post('/api/v1/projects/LMS/screens/SC-01/image', ['image' => UploadedFile::fake()->image('cart.png', 800, 500)], ['Accept' => 'application/json'])->assertOk();

        Storage::disk('local')->assertMissing($sourcePath);
        $this->assertSame('image', Screen::query()->firstOrFail()->source_type);
    }

    public function test_the_map_tells_readers_where_each_screenshot_came_from(): void
    {
        $this->fakeRenderer();
        $this->createFrom(['url' => 'https://example.com/cart', 'width' => 1024])->assertCreated();

        $this->getJson('/api/v1/projects/LMS/map')->assertJsonPath('data.screens.0.source', ['kind' => 'url', 'url' => 'https://example.com/cart', 'width' => 1024]);
    }
}
