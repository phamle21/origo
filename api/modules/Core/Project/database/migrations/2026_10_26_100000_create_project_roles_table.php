<?php

use Database\Seeders\DefaultRolesSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Project roles that admins create, rename and delete. The starting system and project roles are
 * added here, because a fresh install needs them before the first account exists; a member's role
 * points at the role key, guarded by a foreign key.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_roles', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('key', 60)->unique();
            $table->json('name');
            $table->json('description')->nullable();
            $table->json('permissions');
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });

        (new DefaultRolesSeeder)->run();

        Schema::table('project_members', function (Blueprint $table) {
            $table->foreign('role')->references('key')->on('project_roles')->cascadeOnUpdate()->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('project_members', function (Blueprint $table) {
            $table->dropForeign(['role']);
        });
        Schema::dropIfExists('project_roles');
    }
};
