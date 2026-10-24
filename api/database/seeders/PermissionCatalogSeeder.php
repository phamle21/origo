<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * The permissions code knows about, with the names and groups shown to admins. Safe to run again: a
 * missing permission is added, one code no longer knows is removed, and names admins changed are kept.
 */
class PermissionCatalogSeeder extends Seeder
{
    /**
     * scope => key => [group, name (vi, ja), description (vi, ja)]
     *
     * @var array<string, array<string, array{0: string, 1: array{vi: string, ja: string}, 2: array{vi: string, ja: string}}>>
     */
    public const CATALOG = [
        'system' => [
            'users.manage' => ['people', ['vi' => 'Quản lý người dùng', 'ja' => 'ユーザー管理'], ['vi' => 'Tạo tài khoản, khóa, đặt lại mật khẩu, đổi vai trò hệ thống và gán người vào dự án.', 'ja' => 'アカウントの作成・ロック・パスワード再発行、システムロールの変更、プロジェクトへの割り当て。']],
            'settings.manage' => ['system', ['vi' => 'Quản lý cài đặt', 'ja' => '設定管理'], ['vi' => 'Sửa vai trò, quyền, giai đoạn mặc định và ngôn ngữ.', 'ja' => 'ロール、権限、既定の工程、言語を編集します。']],
            'projects.create' => ['projects', ['vi' => 'Tạo dự án', 'ja' => 'プロジェクト作成'], ['vi' => 'Tạo dự án mới; người tạo (hoặc người được chọn) thành người quản lý dự án.', 'ja' => '新しいプロジェクトを作成します。作成者（または指定した人）が管理者になります。']],
            'projects.view_all' => ['projects', ['vi' => 'Xem mọi dự án', 'ja' => 'すべてのプロジェクトを閲覧'], ['vi' => 'Thấy và đọc mọi dự án kể cả khi không được gán, nhưng không sửa được.', 'ja' => '割り当てがなくても全プロジェクトを閲覧できます（変更は不可）。']],
            'projects.manage_all' => ['projects', ['vi' => 'Toàn quyền mọi dự án', 'ja' => '全プロジェクトの全権限'], ['vi' => 'Làm được mọi việc trong mọi dự án như người quản lý dự án.', 'ja' => 'すべてのプロジェクトで管理者と同じ操作ができます。']],
        ],
        'project' => [
            'project.read' => ['reading', ['vi' => 'Xem & góp ý', 'ja' => '閲覧とコメント'], ['vi' => 'Thấy dự án, đọc kế hoạch và thiết kế, góp ý trên các số. Bỏ quyền này thì vai trò không thấy dự án.', 'ja' => 'プロジェクトを表示し、計画と設計を読み、番号にコメントできます。']],
            'plan.edit' => ['plan', ['vi' => 'Sửa kế hoạch', 'ja' => '計画の編集'], ['vi' => 'Thêm, sửa, kéo thả lịch, đổi trạng thái và giai đoạn của kế hoạch.', 'ja' => '計画の追加・編集、日程のドラッグ、状態や工程の変更。']],
            'design.edit' => ['design', ['vi' => 'Sửa thiết kế', 'ja' => '設計の編集'], ['vi' => 'Thêm, chụp lại, sửa các số và nội dung thiết kế màn hình.', 'ja' => '画面の追加・再キャプチャ、番号と設計内容の編集。']],
            'members.manage' => ['team', ['vi' => 'Quản lý thành viên', 'ja' => 'メンバー管理'], ['vi' => 'Thêm, bỏ người khỏi dự án và đổi vai trò của họ.', 'ja' => 'メンバーの追加・削除とロールの変更。']],
            'project.edit' => ['team', ['vi' => 'Sửa thông tin dự án', 'ja' => 'プロジェクト情報の編集'], ['vi' => 'Đổi tên và mô tả của dự án.', 'ja' => 'プロジェクトの名前と説明を変更します。']],
        ],
    ];

    public function run(): void
    {
        $now = now();

        foreach (self::CATALOG as $scope => $permissions) {
            DB::table('permissions')->where('scope', $scope)->whereNotIn('key', array_keys($permissions))->delete();
            $position = 0;

            foreach ($permissions as $key => [$group, $name, $description]) {
                $position++;

                if (DB::table('permissions')->where('scope', $scope)->where('key', $key)->exists()) {
                    continue;
                }

                DB::table('permissions')->insert([
                    'id' => (string) Str::ulid(),
                    'scope' => $scope,
                    'key' => $key,
                    'group' => $group,
                    'name' => json_encode($name),
                    'description' => json_encode($description),
                    'position' => $position,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
}
