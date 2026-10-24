<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('code', 16)->unique();
            // Bilingual text: {"vi": "...", "ja": "..."}.
            $table->jsonb('name');
            $table->jsonb('description')->nullable();
            $table->foreignId('owner_id')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
            $table->timestamp('archived_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
