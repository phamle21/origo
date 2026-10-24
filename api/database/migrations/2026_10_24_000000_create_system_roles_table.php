<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * System roles that admins can create and change; each user has one. The starting roles are added by
 * the project roles migration (DefaultRolesSeeder), once both tables exist.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_roles', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('key', 60)->unique();
            $table->json('name');
            $table->json('description')->nullable();
            $table->json('permissions');
            $table->timestamps();
            $table->boolean('is_default')->default(false);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignUlid('system_role_id')->nullable()->constrained('system_roles')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('system_role_id');
        });
        Schema::dropIfExists('system_roles');
    }
};
