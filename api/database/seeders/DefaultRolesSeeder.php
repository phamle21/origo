<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * The starting roles, created once: when a list is empty its defaults are added, otherwise it is left
 * alone so roles admins changed, added or deleted stay as they are. After that, every role is an
 * ordinary role that can be renamed, re-ticked or deleted.
 */
class DefaultRolesSeeder extends Seeder
{
    /** @var array<string, array{name: array{vi: string, ja: string}, permissions: list<string>, default?: bool}> */
    public const SYSTEM_ROLES = [
        'admin' => ['name' => ['vi' => 'Quản trị', 'ja' => '管理者'], 'permissions' => ['users.manage', 'settings.manage', 'projects.create', 'projects.view_all', 'projects.manage_all']],
        'member' => ['name' => ['vi' => 'Thành viên', 'ja' => 'メンバー'], 'permissions' => [], 'default' => true],
    ];

    /** @var array<string, array{name: array{vi: string, ja: string}, description: array{vi: string, ja: string}, permissions: list<string>}> */
    public const PROJECT_ROLES = [
        'manager' => [
            'name' => ['vi' => 'Quản lý dự án', 'ja' => 'プロジェクトマネージャー'],
            'description' => ['vi' => 'Sửa kế hoạch và thiết kế, thêm/bớt thành viên, đổi vai trò.', 'ja' => '計画と設計を編集し、メンバーの追加・削除とロール変更を行います。'],
            'permissions' => ['project.read', 'plan.edit', 'design.edit', 'members.manage', 'project.edit'],
        ],
        'ba' => [
            'name' => ['vi' => 'BA', 'ja' => 'BA'],
            'description' => ['vi' => 'Sửa kế hoạch và thiết kế màn hình; xem và góp ý mọi nơi.', 'ja' => '計画と画面設計を編集し、すべてを閲覧・コメントできます。'],
            'permissions' => ['project.read', 'plan.edit', 'design.edit'],
        ],
        'dev' => [
            'name' => ['vi' => 'Lập trình viên', 'ja' => '開発者'],
            'description' => ['vi' => 'Xem kế hoạch và thiết kế; góp ý trên các số.', 'ja' => '計画と設計を閲覧し、番号にコメントできます。'],
            'permissions' => ['project.read'],
        ],
        'qa' => [
            'name' => ['vi' => 'QA', 'ja' => 'QA'],
            'description' => ['vi' => 'Xem kế hoạch và thiết kế để viết test case; góp ý trên các số.', 'ja' => 'テストケース作成のため計画と設計を閲覧し、番号にコメントできます。'],
            'permissions' => ['project.read'],
        ],
        'customer' => [
            'name' => ['vi' => 'Khách hàng / PO', 'ja' => '顧客 / PO'],
            'description' => ['vi' => 'Xem và góp ý; không sửa gì.', 'ja' => '閲覧とコメントのみ。変更はできません。'],
            'permissions' => ['project.read'],
        ],
    ];

    public function run(): void
    {
        $now = now();

        if (! DB::table('system_roles')->exists()) {
            foreach (self::SYSTEM_ROLES as $key => $role) {
                DB::table('system_roles')->insert([
                    'id' => (string) Str::ulid(),
                    'key' => $key,
                    'name' => json_encode($role['name']),
                    'permissions' => json_encode($role['permissions']),
                    'is_default' => $role['default'] ?? false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        if (! DB::table('project_roles')->exists()) {
            $position = 0;

            foreach (self::PROJECT_ROLES as $key => $role) {
                DB::table('project_roles')->insert([
                    'id' => (string) Str::ulid(),
                    'key' => $key,
                    'name' => json_encode($role['name']),
                    'description' => json_encode($role['description']),
                    'permissions' => json_encode($role['permissions']),
                    'position' => ++$position,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
}
