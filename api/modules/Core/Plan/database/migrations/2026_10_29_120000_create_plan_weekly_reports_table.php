<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The weekly report of a project: one row per week (keyed by its Monday) with the progress figures
 * frozen at the time, the written summary, and the hours each member worked on the project that week.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_weekly_reports', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('project_id')->constrained()->cascadeOnDelete();
            $table->date('week_start');
            // Frozen summary figures, see PlanSummary::toSnapshot(); null until the week is recorded.
            $table->jsonb('snapshot')->nullable();
            $table->timestamp('snapshot_at')->nullable();
            $table->jsonb('summary')->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'week_start']);
        });

        Schema::create('plan_timesheet_entries', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('week_start');
            $table->decimal('hours', 6, 2);
            $table->timestamps();

            $table->unique(['project_id', 'user_id', 'week_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_timesheet_entries');
        Schema::dropIfExists('plan_weekly_reports');
    }
};
