<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->string('client_name')->nullable();
            $table->string('location')->nullable();
            $table->enum('status', ['planning', 'tender', 'in_progress', 'on_hold', 'completed', 'cancelled'])->default('planning');
            $table->decimal('total_budget', 18, 2)->default(0);
            $table->decimal('total_cost', 18, 2)->default(0);
            $table->decimal('progress_percentage', 5, 2)->default(0);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->date('actual_start_date')->nullable();
            $table->date('actual_end_date')->nullable();
            $table->unsignedBigInteger('project_manager_id')->nullable();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('project_manager_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['company_id', 'status']);
        });

        Schema::create('project_budgets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->string('category');
            $table->string('item_name');
            $table->string('unit')->default('ls');
            $table->decimal('volume', 14, 2)->default(0);
            $table->decimal('unit_price', 18, 2)->default(0);
            $table->decimal('total_price', 18, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->index('project_id');
        });

        Schema::create('project_costs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('budget_item_id')->nullable();
            $table->string('category');
            $table->string('description');
            $table->decimal('amount', 18, 2)->default(0);
            $table->date('cost_date');
            $table->string('vendor')->nullable();
            $table->string('receipt_number')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->unsignedBigInteger('submitted_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('budget_item_id')->references('id')->on('project_budgets')->onDelete('set null');
            $table->foreign('submitted_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['project_id', 'status']);
        });

        Schema::create('project_contracts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->string('contract_number')->unique();
            $table->string('title');
            $table->string('vendor_name');
            $table->string('vendor_contact')->nullable();
            $table->decimal('contract_value', 18, 2)->default(0);
            $table->enum('contract_type', ['main', 'subcontractor', 'supplier', 'consultant'])->default('main');
            $table->enum('status', ['draft', 'active', 'completed', 'terminated'])->default('draft');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->text('scope_of_work')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->index('project_id');
        });

        Schema::create('project_schedules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->string('task_name');
            $table->text('description')->nullable();
            $table->enum('phase', ['tender', 'preparation', 'foundation', 'structure', 'finishing', 'handover', 'other'])->default('other');
            $table->date('planned_start');
            $table->date('planned_end');
            $table->date('actual_start')->nullable();
            $table->date('actual_end')->nullable();
            $table->decimal('progress', 5, 2)->default(0);
            $table->enum('status', ['not_started', 'in_progress', 'completed', 'delayed', 'cancelled'])->default('not_started');
            $table->integer('order')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->index('project_id');
        });

        Schema::create('project_cash_flows', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->enum('type', ['income', 'expense']);
            $table->string('category');
            $table->string('description');
            $table->decimal('amount', 18, 2)->default(0);
            $table->date('transaction_date');
            $table->string('reference_number')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->index(['project_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_cash_flows');
        Schema::dropIfExists('project_schedules');
        Schema::dropIfExists('project_contracts');
        Schema::dropIfExists('project_costs');
        Schema::dropIfExists('project_budgets');
        Schema::dropIfExists('projects');
    }
};
