<?php

namespace Origo\Application\ApiV1\Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Origo\Core\Project\Models\Project;
use Origo\Core\Screen\Models\Concept;
use Origo\Core\Screen\Models\Screen;
use Origo\Core\Screen\Models\ScreenPoint;
use Tests\TestCase;

class ScreenMapApiTest extends TestCase
{
    use RefreshDatabase;

    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        $this->project = Project::factory()->create(['code' => 'LMS']);
    }

    /**
     * @return array<string, mixed>
     */
    private function point(array $overrides = []): array
    {
        return [
            'box' => [10, 10, 20, 10],
            'title' => ['vi' => 'Giá', 'ja' => '価格'],
            'basic' => ['summary' => ['vi' => 'Hiện giá', 'ja' => null], 'rules' => [['vi' => 'Đã gồm thuế', 'ja' => '税込']]],
            'detail' => ['rows' => [], 'endpoints' => ['GET /api/v1/courses/{slug}']],
            'tests' => [['given' => ['vi' => 'A'], 'when' => ['vi' => 'B'], 'then' => ['vi' => 'C']]],
            'history' => [],
            'concepts' => [],
            'dependsOn' => [],
            ...$overrides,
        ];
    }

    private function createScreen(): Screen
    {
        $this->actingAsProjectMember($this->project);

        $this->post('/api/v1/projects/LMS/screens', [
            'name' => ['vi' => 'Giỏ hàng', 'ja' => 'カート'],
            'image' => UploadedFile::fake()->image('cart.png', 800, 500),
        ], ['Accept' => 'application/json'])->assertCreated();

        return Screen::query()->latest('position')->firstOrFail();
    }

    public function test_the_map_requires_a_signed_in_member(): void
    {
        $this->getJson('/api/v1/projects/LMS/map')->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/v1/projects/LMS/map')->assertForbidden();
    }

    public function test_a_developer_reads_the_map_but_cannot_change_the_design(): void
    {
        $this->actingAsProjectMember($this->project, 'dev');

        $this->getJson('/api/v1/projects/LMS/map')
            ->assertOk()
            ->assertJsonPath('data.myRole', 'dev')
            ->assertJsonPath('data.permissions.canEditDesign', false);
        $this->post('/api/v1/projects/LMS/screens', ['name' => ['vi' => 'x'], 'image' => UploadedFile::fake()->image('a.png')], ['Accept' => 'application/json'])->assertForbidden();
    }

    public function test_an_editor_creates_screens_with_sequential_codes_and_a_webp_image(): void
    {
        $first = $this->createScreen();
        $second = $this->createScreen();

        $this->assertSame(['SC-01', 'SC-02'], [$first->code, $second->code]);
        $this->assertStringEndsWith('.webp', $first->image_path);
        $this->assertSame([800, 500], [$first->image_width, $first->image_height]);
        Storage::disk('public')->assertExists($first->image_path);
    }

    public function test_the_code_of_a_deleted_screen_is_never_given_to_another_screen(): void
    {
        $this->createScreen();
        $second = $this->createScreen();

        $this->deleteJson("/api/v1/projects/LMS/screens/{$second->code}")->assertNoContent();

        $this->assertSame('SC-03', $this->createScreen()->code);
    }

    public function test_a_non_image_upload_is_rejected(): void
    {
        $this->actingAsProjectMember($this->project);

        $this->post('/api/v1/projects/LMS/screens', [
            'name' => ['vi' => 'Giỏ hàng'],
            'image' => UploadedFile::fake()->create('cart.svg', 10, 'image/svg+xml'),
        ], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('image');
    }

    public function test_saving_points_numbers_them_in_order_and_links_concepts_and_dependencies(): void
    {
        $screen = $this->createScreen();
        Concept::create(['project_id' => $this->project->id, 'key' => 'course-price', 'name' => ['vi' => 'Giá'], 'description' => [], 'also_used_in' => []]);
        $upstream = ScreenPoint::factory()->create(['screen_id' => Screen::factory()->create(['project_id' => $this->project->id, 'code' => 'SC-09'])->id]);

        $this->putJson("/api/v1/projects/LMS/screens/{$screen->code}/points", ['points' => [
            $this->point(['concepts' => ['course-price'], 'dependsOn' => [$upstream->id]]),
            $this->point(['title' => ['vi' => 'Nút mua', 'ja' => null]]),
        ]])->assertOk()->assertJsonPath('data.pointCount', 2);

        $points = $screen->points()->with(['concepts', 'dependencies'])->get();

        $this->assertSame([1, 2], $points->pluck('number')->all());
        $this->assertSame(['course-price'], $points[0]->concepts->pluck('key')->all());
        $this->assertSame([$upstream->id], $points[0]->dependencies->pluck('id')->all());
        $this->assertSame(['vi' => 'Nút mua', 'ja' => null], $points[1]->title);
    }

    public function test_saving_again_updates_kept_points_reorders_them_and_deletes_the_rest(): void
    {
        $screen = $this->createScreen();
        $this->putJson("/api/v1/projects/LMS/screens/{$screen->code}/points", ['points' => [$this->point(), $this->point(), $this->point()]])->assertOk();
        [$first, , $third] = $screen->points()->get()->all();

        $this->putJson("/api/v1/projects/LMS/screens/{$screen->code}/points", ['points' => [
            $this->point(['id' => $third->id, 'title' => ['vi' => 'Đổi lên đầu']]),
            $this->point(['id' => $first->id]),
        ]])->assertOk();

        $points = $screen->points()->get();

        $this->assertSame([$third->id, $first->id], $points->pluck('id')->all());
        $this->assertSame([1, 2], $points->pluck('number')->all());
        $this->assertSame('Đổi lên đầu', $points[0]->title['vi']);
    }

    public function test_a_box_outside_the_image_or_a_point_of_another_screen_is_rejected(): void
    {
        $screen = $this->createScreen();
        $foreign = ScreenPoint::factory()->create();

        $this->putJson("/api/v1/projects/LMS/screens/{$screen->code}/points", ['points' => [$this->point(['box' => [90, 10, 20, 10]])]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('points.0.box');

        $this->putJson("/api/v1/projects/LMS/screens/{$screen->code}/points", ['points' => [$this->point(['id' => $foreign->id])]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('points.0.id');
    }

    public function test_the_map_lists_screens_points_and_dependency_references(): void
    {
        $screen = $this->createScreen();
        $this->putJson("/api/v1/projects/LMS/screens/{$screen->code}/points", ['points' => [$this->point(), $this->point()]])->assertOk();
        $points = $screen->points()->get();
        $this->putJson("/api/v1/projects/LMS/screens/{$screen->code}/points", ['points' => [
            $this->point(['id' => $points[0]->id]),
            $this->point(['id' => $points[1]->id, 'dependsOn' => [$points[0]->id]]),
        ]])->assertOk();

        $this->getJson('/api/v1/projects/LMS/map')
            ->assertOk()
            ->assertJsonPath('data.screens.0.code', 'SC-01')
            ->assertJsonPath('data.screens.0.points.1.dependsOn', ['SC-01#1'])
            ->assertJsonPath('data.screens.0.points.0.title.ja', '価格');
    }

    public function test_replacing_the_image_keeps_the_points_and_removes_the_old_file(): void
    {
        $screen = $this->createScreen();
        $this->putJson("/api/v1/projects/LMS/screens/{$screen->code}/points", ['points' => [$this->point()]])->assertOk();
        $oldPath = $screen->image_path;

        $this->post("/api/v1/projects/LMS/screens/{$screen->code}/image", ['image' => UploadedFile::fake()->image('new.png', 1000, 600)], ['Accept' => 'application/json'])
            ->assertOk();

        $screen->refresh();
        Storage::disk('public')->assertMissing($oldPath);
        $this->assertSame(1000, $screen->image_width);
        $this->assertSame(1, $screen->points()->count());
    }

    public function test_deleting_a_screen_removes_its_points_and_image(): void
    {
        $screen = $this->createScreen();
        $this->putJson("/api/v1/projects/LMS/screens/{$screen->code}/points", ['points' => [$this->point()]])->assertOk();

        $this->deleteJson("/api/v1/projects/LMS/screens/{$screen->code}")->assertNoContent();

        $this->assertDatabaseCount('screen_points', 0);
        Storage::disk('public')->assertMissing($screen->image_path);
    }

    public function test_a_viewer_can_read_and_comment_but_not_edit(): void
    {
        $screen = $this->createScreen();
        $this->putJson("/api/v1/projects/LMS/screens/{$screen->code}/points", ['points' => [$this->point()]])->assertOk();
        $point = $screen->points()->firstOrFail();

        $this->actingAsProjectMember($this->project, 'customer', ['name' => 'Yamada', 'title' => 'PO']);

        $this->getJson('/api/v1/projects/LMS/map')->assertOk();
        $this->putJson("/api/v1/projects/LMS/screens/{$screen->code}/points", ['points' => []])->assertForbidden();
        $this->deleteJson("/api/v1/projects/LMS/screens/{$screen->code}")->assertForbidden();
        $this->postJson("/api/v1/points/{$point->id}/comments", ['text' => '税込ですか？'])
            ->assertCreated()
            ->assertJsonPath('data.author', 'Yamada')
            ->assertJsonPath('data.role', 'PO');
    }

    public function test_concept_keys_are_generated_from_the_name_and_kept_unique(): void
    {
        $this->actingAsProjectMember($this->project);

        $this->postJson('/api/v1/projects/LMS/concepts', ['name' => ['vi' => 'Giá khóa học', 'ja' => 'コース価格']])->assertCreated()->assertJsonPath('data.key', 'gia-khoa-hoc');
        $this->postJson('/api/v1/projects/LMS/concepts', ['name' => ['vi' => 'Giá khóa học']])->assertCreated()->assertJsonPath('data.key', 'gia-khoa-hoc-2');
    }

    public function test_screens_of_another_project_are_not_reachable_through_this_project(): void
    {
        $screen = $this->createScreen();
        $other = Project::factory()->create(['code' => 'HRM']);
        $other->members()->create(['user_id' => auth()->id(), 'role' => 'ba']);

        $this->deleteJson("/api/v1/projects/HRM/screens/{$screen->code}")->assertNotFound();
    }
}
