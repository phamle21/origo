<?php

namespace Origo\Application\ApiV1\Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Origo\Core\Project\Models\Project;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class PlanExcelTemplateApiTest extends TestCase
{
    use RefreshDatabase;

    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        Carbon::setTestNow('2026-10-21 08:00:00');
        $this->project = Project::factory()->create(['code' => 'LMS']);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    /** A small workbook laid out like the team's sheet, filled with another project's data. */
    private function teamWorkbook(): UploadedFile
    {
        $book = new Spreadsheet;
        $copy = $book->getActiveSheet()->setTitle('Copy of Phase1 Gantt Chart');
        $copy->fromArray([['', '', '', 'PAGE TITLE/To-do', '', '', '', 'VOLUME']], null, 'A9');

        $gantt = $book->createSheet()->setTitle('Phase1 Gantt Chart');
        $gantt->setCellValue('B1', '[OLD] Old project');
        $gantt->setCellValue('H1', '①Old stage');
        $gantt->setCellValue('L3', ExcelDate::PHPToExcel(Carbon::parse('2026-10-19')));
        $gantt->setCellValue('E4', '=IFERROR(__xludf.DUMMYFUNCTION("TO_PERCENT(SUM(M2)/SUM(K2))"),0.99)');
        $gantt->setCellValue('K2', '=SUM(H12:H13)');
        $gantt->setCellValue('M2', '=SUMPRODUCT(M12:M13,H12:H13)');
        $gantt->fromArray([['P', 'NO.', '', 'PAGE TITLE/To-do', 'Notes', 'START DATE', 'DUE DATE', "VOLUME\n(man-days)", 'Start', 'End', 'P.I.C', 'Status', '%', 'Link', 'Note']], null, 'A9');
        $gantt->setCellValue('BM9', '=L3');
        $gantt->setCellValue('BN9', '=BM9+1');
        $gantt->setCellValue('BO9', '=BN9+1');
        $gantt->setCellValue('BM10', '=LEFT(TEXT(BM9:BO9,"ddd"))');
        $gantt->fromArray(['', 'Phase 01', '', 'Old phase'], null, 'A10');
        $gantt->fromArray(['', '0', 'Old module', '', 'Old module note'], null, 'A11');
        foreach ([12, 13] as $row) {
            $gantt->fromArray(['P1', '', '', "Old feature {$row}", 'Old note'], null, "A{$row}");
            $gantt->setCellValue("F{$row}", "=IF(min(I{$row})=0,\"--\",MIN(I{$row}))");
            $gantt->setCellValue("G{$row}", "=IF(max(J{$row})=0,\"--\",max(J{$row}))");
            $gantt->setCellValue("H{$row}", 3);
            $gantt->setCellValue("K{$row}", 'Old person');
            $gantt->setCellValue("L{$row}", '5. Done');
            $gantt->setCellValue("N{$row}", 'Old document');
            $gantt->getCell("N{$row}")->getHyperlink()->setUrl('https://old.example.com/doc');
            foreach (['BM', 'BN', 'BO'] as $column) {
                $gantt->setCellValue("{$column}{$row}", '=IFERROR(__xludf.DUMMYFUNCTION("""COMPUTED_VALUE"""),"〇")');
            }
        }
        $gantt->fromArray(['', 'Phase 02', '', 'Old second phase'], null, 'A14');
        $gantt->getComment('D12')->getText()->createText('Old comment');

        $setting = $book->createSheet()->setTitle('.setting');
        $setting->fromArray([['Status', '', 'P.I.C', '', 'Holiday'], ['1. New', '', 'Old person', '', 45658], ['3. Doing'], ['5. Done']], null, 'A1');

        $weekly = $book->createSheet()->setTitle('Weekly Report');
        $weekly->setCellValue('C3', 45658);
        $weekly->setCellValue('E4', 3);
        $weekly->fromArray([1, '=F4+1', '=G4+1'], null, 'F4');
        $weekly->setCellValue('A5', 'No.');
        $weekly->fromArray([[1, 'ID-1', 'Old person', '', '', 8], [2]], null, 'A6');
        $weekly->setCellValue('A10', 'Phase 01');
        $weekly->fromArray([[1, 'Stage A', '', 5, '', 0.5]], null, 'A11');
        $weekly->setCellValue('C12', 'PROGRESS (%man-days)');
        $weekly->setCellValue('F12', 0.3);
        $weekly->setCellValue('A15', 'Weekly Summary');
        $weekly->setCellValue('F16', 'Old summary');
        $weekly->setCellValue('F17', '=IFERROR(__xludf.DUMMYFUNCTION("GOOGLETRANSLATE(F16)"),"古い")');

        $path = tempnam(sys_get_temp_dir(), 'team').'.xlsx';
        (new Xlsx($book))->save($path);

        return new UploadedFile($path, 'team.xlsx', null, null, true);
    }

    private function asAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);

        return $admin;
    }

    private function storedBook(): Spreadsheet
    {
        return IOFactory::load(Storage::disk('local')->path('plan-templates/project-management.xlsx'));
    }

    public function test_an_uploaded_workbook_is_kept_without_its_project_data(): void
    {
        $this->asAdmin();

        $this->post('/api/v1/admin/settings/plan-template', ['file' => $this->teamWorkbook()], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.ganttSheet', 'Phase1 Gantt Chart')
            ->assertJsonPath('data.candidates', ['Phase1 Gantt Chart', 'Copy of Phase1 Gantt Chart'])
            ->assertJsonPath('data.weeklySheet', 'Weekly Report');

        $book = $this->storedBook();
        $gantt = $book->getSheetByNameOrThrow('Phase1 Gantt Chart');

        // The three sheets stay in the workbook's own order; the copy is gone.
        $this->assertSame(['Phase1 Gantt Chart', '.setting', 'Weekly Report'], $book->getSheetNames());
        $this->assertNull($gantt->getCell('B1')->getValue());
        $this->assertNull($gantt->getCell('D12')->getValue());
        $this->assertNull($gantt->getCell('K12')->getValue());
        $this->assertSame('=IF(min(I12)=0,"--",MIN(I12))', $gantt->getCell('F12')->getValue());
        $this->assertStringEndsWith(',"")', $gantt->getCell('BN12')->getValue());
        $this->assertSame([], $gantt->getHyperlinkCollection());
        $this->assertSame([], $gantt->getComments());
        // One row of each kind is left (empty rows are not written out).
        $this->assertLessThanOrEqual(13, $gantt->getHighestRow());
        $this->assertSame('1. New', $book->getSheetByNameOrThrow('.setting')->getCell('A2')->getValue());
        $this->assertNull($book->getSheetByNameOrThrow('.setting')->getCell('C2')->getValue());
        $weekly = $book->getSheetByNameOrThrow('Weekly Report');
        $this->assertNull($weekly->getCell('C6')->getValue());
        $this->assertNull($weekly->getCell('F16')->getValue());
        $this->assertStringEndsWith(',"")', $weekly->getCell('F17')->getValue());
        $this->assertSame('=F4+1', $weekly->getCell('G4')->getValue());
    }

    public function test_the_export_fills_the_template_like_a_person_would(): void
    {
        $this->asAdmin();
        $this->post('/api/v1/admin/settings/plan-template', ['file' => $this->teamWorkbook()], ['Accept' => 'application/json'])->assertCreated();

        $member = $this->actingAsProjectMember($this->project, 'ba', ['name' => 'Nguyễn Huy Hoàng']);
        $stage = $this->getJson('/api/v1/projects/LMS/plan')->json('data.stages.0.id');
        $phase = $this->postJson('/api/v1/projects/LMS/plan/items', ['kind' => 'phase', 'name' => ['vi' => 'Phase 01 · Bán hàng'], 'parentId' => null])->json('data.id');
        $module = $this->postJson('/api/v1/projects/LMS/plan/items', ['kind' => 'module', 'name' => ['vi' => 'Giỏ hàng'], 'parentId' => $phase])->json('data.id');
        foreach (['Thêm vào giỏ', 'Mã giảm giá', 'Thanh toán'] as $name) {
            $feature = $this->postJson('/api/v1/projects/LMS/plan/items', ['kind' => 'feature', 'name' => ['vi' => $name], 'parentId' => $module])->json('data.id');
            $this->patchJson("/api/v1/projects/LMS/plan/items/{$feature}", ['priority' => 2]);
            $this->putJson("/api/v1/projects/LMS/plan/items/{$feature}/tasks/{$stage}", ['startDate' => '2026-10-19', 'endDate' => '2026-10-20', 'status' => 'done', 'assigneeId' => $member->id, 'estimateDays' => 1.5, 'link' => 'https://example.com/spec'])->assertOk();
        }

        $response = $this->get('/api/v1/projects/LMS/plan/export')->assertOk();
        $path = tempnam(sys_get_temp_dir(), 'export').'.xlsx';
        file_put_contents($path, $response->streamedContent());
        $book = IOFactory::load($path);
        unlink($path);
        $gantt = $book->getSheetByNameOrThrow('Phase1 Gantt Chart');

        $this->assertSame('[LMS] '.$this->project->name['vi'], $gantt->getCell('B1')->getValue());
        $this->assertSame(['Phase 01', 'Bán hàng'], [$gantt->getCell('B10')->getValue(), $gantt->getCell('D10')->getValue()]);
        $this->assertSame([0, 'Giỏ hàng'], [(int) $gantt->getCell('B11')->getValue(), $gantt->getCell('C11')->getValue()]);
        foreach ([12, 13, 14] as $row) {
            $this->assertSame('P2', $gantt->getCell("A{$row}")->getValue());
            $this->assertEquals(1.5, $gantt->getCell("H{$row}")->getValue());
            $this->assertSame('Hoàng', $gantt->getCell("K{$row}")->getValue());
            $this->assertSame('5. Done', $gantt->getCell("L{$row}")->getValue());
            $this->assertSame('https://example.com/spec', $gantt->getCell("N{$row}")->getHyperlink()->getUrl());
            $this->assertSame("=IF(min(I{$row})=0,\"--\",MIN(I{$row}))", $gantt->getCell("F{$row}")->getValue());
            // Monday and Tuesday are marked in the chart, Wednesday not.
            $this->assertStringEndsWith(',"〇")', $gantt->getCell("BM{$row}")->getValue());
            $this->assertStringEndsWith(',"")', $gantt->getCell("BO{$row}")->getValue());
        }
        $this->assertSame(14, $gantt->getHighestDataRow('D'));
        $this->assertStringEndsWith(',1)', $gantt->getCell('E4')->getValue());
        $this->assertSame('Hoàng', $book->getSheetByNameOrThrow('.setting')->getCell('C2')->getValue());
        $this->assertSame('Nguyễn Huy Hoàng', $book->getSheetByNameOrThrow('Weekly Report')->getCell('C6')->getValue());
    }

    public function test_only_admins_manage_the_template_and_a_wrong_file_is_refused(): void
    {
        $this->actingAsProjectMember($this->project, 'manager');
        $this->getJson('/api/v1/admin/settings/plan-template')->assertForbidden();

        $this->asAdmin();
        $this->getJson('/api/v1/admin/settings/plan-template')->assertOk()->assertJsonPath('data', null);
        $this->post('/api/v1/admin/settings/plan-template', ['file' => UploadedFile::fake()->createWithContent('notes.xlsx', 'not a workbook')], ['Accept' => 'application/json'])
            ->assertUnprocessable();

        $book = new Spreadsheet;
        $path = tempnam(sys_get_temp_dir(), 'plain').'.xlsx';
        (new Xlsx($book))->save($path);
        $this->post('/api/v1/admin/settings/plan-template', ['file' => new UploadedFile($path, 'plain.xlsx', null, null, true)], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors(['file']);
    }

    public function test_without_a_template_the_export_uses_origos_own_layout(): void
    {
        $this->asAdmin();
        $this->post('/api/v1/admin/settings/plan-template', ['file' => $this->teamWorkbook()], ['Accept' => 'application/json'])->assertCreated();
        $this->deleteJson('/api/v1/admin/settings/plan-template')->assertNoContent();

        $response = $this->get('/api/v1/projects/LMS/plan/export')->assertOk();
        $path = tempnam(sys_get_temp_dir(), 'export').'.xlsx';
        file_put_contents($path, $response->streamedContent());

        $this->assertSame('Gantt Chart', IOFactory::load($path)->getSheet(0)->getTitle());
        unlink($path);
    }
}
