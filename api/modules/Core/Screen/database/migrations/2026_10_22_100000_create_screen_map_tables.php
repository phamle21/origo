<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Bilingual columns hold {"vi": ..., "ja": ...}; design columns hold the structures documented on
// ScreenPoint. One row per point keeps a point's whole design in a single read and write.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('screens', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('project_id')->constrained()->cascadeOnDelete();
            $table->string('code', 8);
            $table->jsonb('name');
            $table->jsonb('flow');
            $table->jsonb('purpose');
            $table->string('image_path');
            $table->unsignedInteger('image_width');
            $table->unsignedInteger('image_height');
            $table->unsignedInteger('position');
            $table->timestamps();
            $table->string('source_type', 8)->default('image');
            $table->string('source_url', 2048)->nullable();
            $table->string('source_path')->nullable();
            $table->unsignedSmallInteger('render_width')->nullable();

            $table->unique(['project_id', 'code']);
        });

        Schema::create('screen_points', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('screen_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('number');
            $table->jsonb('box');
            $table->jsonb('title');
            $table->jsonb('basic');
            $table->jsonb('detail');
            $table->jsonb('tests');
            $table->jsonb('history');
            $table->timestamps();

            $table->index(['screen_id', 'number']);
        });

        Schema::create('concepts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('project_id')->constrained()->cascadeOnDelete();
            $table->string('key', 80);
            $table->jsonb('name');
            $table->jsonb('description');
            $table->jsonb('also_used_in');
            $table->timestamps();

            $table->unique(['project_id', 'key']);
        });

        Schema::create('concept_screen_point', function (Blueprint $table) {
            $table->foreignUlid('concept_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('screen_point_id')->constrained()->cascadeOnDelete();
            $table->primary(['concept_id', 'screen_point_id']);
        });

        Schema::create('screen_point_dependencies', function (Blueprint $table) {
            $table->foreignUlid('screen_point_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('depends_on_id')->constrained('screen_points')->cascadeOnDelete();
            $table->primary(['screen_point_id', 'depends_on_id']);
        });

        Schema::create('point_comments', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('screen_point_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('point_comments');
        Schema::dropIfExists('screen_point_dependencies');
        Schema::dropIfExists('concept_screen_point');
        Schema::dropIfExists('concepts');
        Schema::dropIfExists('screen_points');
        Schema::dropIfExists('screens');
    }
};
