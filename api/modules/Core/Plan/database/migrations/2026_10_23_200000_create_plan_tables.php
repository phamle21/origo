<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_stages', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('project_id')->constrained()->cascadeOnDelete();
            $table->string('key', 60);
            $table->jsonb('name');
            $table->string('color', 7);
            $table->unsignedSmallInteger('position');
            $table->timestamps();

            $table->unique(['project_id', 'key']);
        });

        // Phase → module → feature; only features carry dated tasks.
        Schema::create('plan_items', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('project_id')->constrained()->cascadeOnDelete();
            $table->ulid('parent_id')->nullable();
            $table->string('kind', 8);
            $table->jsonb('name');
            $table->unsignedInteger('position');
            $table->timestamps();
            $table->text('note')->nullable();

            $table->index(['project_id', 'parent_id', 'position']);
        });

        // Added after the table exists: PostgreSQL needs the primary key before a self-reference.
        Schema::table('plan_items', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('plan_items')->cascadeOnDelete();
        });

        Schema::create('plan_tasks', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('plan_item_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('plan_stage_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status', 8)->default('todo');
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['plan_item_id', 'plan_stage_id']);
        });

        Schema::create('plan_item_screen', function (Blueprint $table) {
            $table->foreignUlid('plan_item_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('screen_id')->constrained()->cascadeOnDelete();
            $table->primary(['plan_item_id', 'screen_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_item_screen');
        Schema::dropIfExists('plan_tasks');
        Schema::dropIfExists('plan_items');
        Schema::dropIfExists('plan_stages');
    }
};
