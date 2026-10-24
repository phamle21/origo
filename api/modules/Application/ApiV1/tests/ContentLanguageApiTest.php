<?php

namespace Origo\Application\ApiV1\Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Origo\Core\Project\Models\Project;
use Tests\TestCase;

class ContentLanguageApiTest extends TestCase
{
    use RefreshDatabase;

    /** @param list<array{code: string, name: string, isActive: bool}> $languages */
    private function saveLanguages(array $languages): TestResponse
    {
        return $this->putJson('/api/v1/admin/settings/content-languages', ['languages' => $languages]);
    }

    public function test_vietnamese_is_the_default_and_japanese_starts_enabled(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/content-languages')
            ->assertOk()
            ->assertJsonPath('data.0', ['code' => 'vi', 'name' => 'Tiếng Việt', 'isActive' => true, 'isDefault' => true])
            ->assertJsonPath('data.1.code', 'ja');
    }

    public function test_an_added_language_gets_its_own_field_everywhere(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->saveLanguages([
            ['code' => 'vi', 'name' => 'Tiếng Việt', 'isActive' => true],
            ['code' => 'ja', 'name' => '日本語', 'isActive' => true],
            ['code' => 'en', 'name' => 'English', 'isActive' => true],
        ])->assertOk()->assertJsonCount(3, 'data');

        $this->postJson('/api/v1/projects', ['code' => 'CRM', 'name' => ['vi' => 'Bán hàng', 'en' => 'Sales'], 'description' => ['vi' => null]])->assertCreated();
        $this->getJson('/api/v1/projects/CRM/map')->assertJsonPath('data.name', ['vi' => 'Bán hàng', 'ja' => null, 'en' => 'Sales']);

        $this->postJson('/api/v1/projects', ['code' => 'BAD', 'name' => ['vi' => 'X', 'fr' => 'Y'], 'description' => ['vi' => null]])->assertUnprocessable();
    }

    public function test_switching_a_language_off_hides_it_but_keeps_written_translations(): void
    {
        $project = Project::factory()->create(['code' => 'LMS', 'name' => ['vi' => 'Học', 'ja' => '学習']]);
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->saveLanguages([
            ['code' => 'vi', 'name' => 'Tiếng Việt', 'isActive' => true],
            ['code' => 'ja', 'name' => '日本語', 'isActive' => false],
        ])->assertOk();

        $this->getJson('/api/v1/content-languages')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/projects/LMS/map')->assertJsonPath('data.name', ['vi' => 'Học', 'ja' => '学習']);

        // A form that only shows Vietnamese sends the Japanese text back untouched, so it survives an edit.
        $this->putJson('/api/v1/projects/'.$project->id, ['name' => ['vi' => 'Học trực tuyến', 'ja' => '学習'], 'description' => ['vi' => null]])->assertOk();
        $this->assertSame('学習', $project->refresh()->name['ja']);
    }

    public function test_languages_cannot_be_removed_and_the_default_cannot_be_switched_off(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->saveLanguages([['code' => 'vi', 'name' => 'Tiếng Việt', 'isActive' => true]])->assertUnprocessable();
        $this->saveLanguages([
            ['code' => 'ja', 'name' => '日本語', 'isActive' => true],
            ['code' => 'vi', 'name' => 'Tiếng Việt', 'isActive' => false],
        ])->assertOk()->assertJsonPath('data.0', ['code' => 'vi', 'name' => 'Tiếng Việt', 'isActive' => true, 'isDefault' => true]);
        $this->saveLanguages([
            ['code' => 'vi', 'name' => 'Tiếng Việt', 'isActive' => true],
            ['code' => 'ja', 'name' => '日本語', 'isActive' => true],
            ['code' => 'Not A Code', 'name' => 'X', 'isActive' => true],
        ])->assertUnprocessable();
    }

    public function test_only_settings_managers_change_languages(): void
    {
        $this->actingAsProjectMember(Project::factory()->create(), 'manager');

        $this->getJson('/api/v1/admin/settings/content-languages')->assertForbidden();
        $this->saveLanguages([['code' => 'vi', 'name' => 'Tiếng Việt', 'isActive' => true]])->assertForbidden();
    }

    public function test_saving_the_list_keeps_when_each_language_was_added(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        DB::table('content_languages')->where('code', 'ja')->update(['created_at' => '2026-01-01 00:00:00']);

        $this->saveLanguages([
            ['code' => 'vi', 'name' => 'Tiếng Việt', 'isActive' => true],
            ['code' => 'ja', 'name' => 'Japanese', 'isActive' => true],
        ])->assertOk();

        $row = DB::table('content_languages')->where('code', 'ja')->first();
        $this->assertSame('Japanese', $row->name);
        $this->assertStringStartsWith('2026-01-01', (string) $row->created_at);
    }
}
