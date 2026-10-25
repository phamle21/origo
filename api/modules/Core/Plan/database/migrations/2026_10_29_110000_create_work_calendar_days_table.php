<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Exceptions to the Monday–Friday working week, shared by every project: public holidays and make-up
 * working days (a Saturday worked in exchange for a holiday). Working-day counts in plans use them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_calendar_days', function (Blueprint $table) {
            $table->date('date')->primary();
            $table->string('kind', 8);
            $table->string('name', 80)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_calendar_days');
    }
};
