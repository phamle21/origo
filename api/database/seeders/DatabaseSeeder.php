<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Base data only: the permission catalog and the starting roles. The migrations already add both, and
 * each seeder only fills what is missing, so running it again changes nothing. There are no sample
 * projects or accounts; the first admin is created with `php artisan origo:create-admin`.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([PermissionCatalogSeeder::class, DefaultRolesSeeder::class]);
    }
}
