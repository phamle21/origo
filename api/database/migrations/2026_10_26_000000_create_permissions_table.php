<?php

use Database\Seeders\PermissionCatalogSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The catalog of permissions (system and project), so admins can rename, describe and group them.
 * The keys stay fixed because code checks them; the seeder fills the catalog the first time.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('scope', 16);
            $table->string('key', 60);
            $table->string('group', 30);
            $table->json('name');
            $table->json('description')->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
            $table->unique(['scope', 'key']);
        });

        (new PermissionCatalogSeeder)->run();
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};
