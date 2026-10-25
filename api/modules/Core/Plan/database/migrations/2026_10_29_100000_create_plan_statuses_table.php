<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Each project names its own task statuses (e.g. New, Analytic, Doing, Checking, Done, Reject, Pending,
 * Waiting). Every status belongs to one of three categories, todo / doing / done, which the chart colours
 * and the progress figures rely on; `plan_tasks.status` keeps that category.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_statuses', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('project_id')->constrained()->cascadeOnDelete();
            $table->jsonb('name');
            $table->string('category', 8);
            $table->string('color', 7);
            $table->unsignedSmallInteger('position');
            $table->timestamps();

            $table->index(['project_id', 'position']);
        });

        Schema::table('plan_tasks', function (Blueprint $table) {
            $table->foreignUlid('plan_status_id')->nullable()->constrained('plan_statuses')->nullOnDelete();
            // Planned effort in man-days and how much of it is finished (0–100).
            $table->decimal('estimate_days', 6, 2)->nullable();
            $table->unsignedTinyInteger('progress')->nullable();
            $table->string('link', 2048)->nullable();
            $table->text('note')->nullable();
        });

        Schema::table('plan_items', function (Blueprint $table) {
            // 1 (highest) to 5, shown as P1–P5.
            $table->unsignedTinyInteger('priority')->nullable();
        });

        Schema::table('plan_stages', function (Blueprint $table) {
            // The window agreed for the whole stage and who is responsible for it, e.g. "VN", "JP" or the customer.
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('owner', 30)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('plan_stages', function (Blueprint $table) {
            $table->dropColumn(['start_date', 'end_date', 'owner']);
        });
        Schema::table('plan_items', function (Blueprint $table) {
            $table->dropColumn('priority');
        });
        Schema::table('plan_tasks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('plan_status_id');
            $table->dropColumn(['estimate_days', 'progress', 'link', 'note']);
        });
        Schema::dropIfExists('plan_statuses');
    }
};
