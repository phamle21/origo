<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** People tagged with @ in a comment; they are told about it and their names are highlighted. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('point_comment_mentions', function (Blueprint $table) {
            $table->foreignUlid('point_comment_id')->constrained('point_comments')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->primary(['point_comment_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('point_comment_mentions');
    }
};
