<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_stage_templates', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('key', 60)->unique();
            $table->json('name');
            $table->string('color', 7);
            $table->unsignedSmallInteger('position');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_stage_templates');
    }
};
