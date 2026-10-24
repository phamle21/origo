<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Languages the documentation content is written in. Vietnamese is the default and always comes
 * first; Japanese starts enabled because existing content already has Japanese translations.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_languages', function (Blueprint $table) {
            $table->string('code', 12)->primary();
            $table->string('name', 60);
            $table->unsignedSmallInteger('position');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $now = now();
        DB::table('content_languages')->insert([
            ['code' => 'vi', 'name' => 'Tiếng Việt', 'position' => 1, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'ja', 'name' => '日本語', 'position' => 2, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('content_languages');
    }
};
