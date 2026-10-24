<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Remembers the highest screen number ever issued per project, so a deleted screen's code is never
// given to a different screen (old links must not silently point elsewhere).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('screen_code_sequences', function (Blueprint $table) {
            $table->foreignUlid('project_id')->primary()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('last_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('screen_code_sequences');
    }
};
