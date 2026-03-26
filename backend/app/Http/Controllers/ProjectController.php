<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectBudget;
use App\Models\ProjectCost;
use App\Models\ProjectContract;
use App\Models\ProjectSchedule;
use App\Models\ProjectCashFlow;
use App\Models\User;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    // ============================
    // PROJECTS CRUD
    // ============================

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Project::with(['projectManager:id,name'])
            ->where('company_id', $user->company_id);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('client_name', 'like', "%{$search}%");
            });
        }

        $projects = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $projects
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:projects,code',
            'description' => 'nullable|string',
            'client_name' => 'nullable|string',
            'location' => 'nullable|string',
            'status' => 'in:planning,tender,in_progress,on_hold,completed,cancelled',
            'total_budget' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'project_manager_id' => 'nullable|exists:users,id',
        ]);

        $project = Project::create([
            'company_id' => $request->user()->company_id,
            ...$request->only([
                'name', 'code', 'description', 'client_name', 'location',
                'status', 'total_budget', 'start_date', 'end_date', 'project_manager_id'
            ])
        ]);

        $this->logActivity('CREATE_PROJECT', "Membuat proyek baru: {$project->name} ({$project->code})", $project);

        return response()->json([
            'success' => true,
            'message' => 'Proyek berhasil dibuat.',
            'data' => $project->load('projectManager:id,name')
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $project = Project::with([
            'projectManager:id,name,email',
            'budgets',
            'costs.submitter:id,name',
            'costs.budgetItem:id,item_name,category',
            'contracts',
            'schedules',
            'cashFlows'
        ])->where('company_id', $request->user()->company_id)->findOrFail($id);

        // Calculate summary data
        $totalBudget = $project->budgets->sum('total_price');
        $totalCostApproved = $project->costs->where('status', 'approved')->sum('amount');
        $totalCostPending = $project->costs->where('status', 'pending')->sum('amount');
        $totalIncome = $project->cashFlows->where('type', 'income')->sum('amount');
        $totalExpense = $project->cashFlows->where('type', 'expense')->sum('amount');

        // Budget by category
        $budgetByCategory = $project->budgets->groupBy('category')->map(function ($items, $category) {
            return [
                'category' => $category,
                'total' => $items->sum('total_price'),
                'items_count' => $items->count(),
            ];
        })->values();

        // Cost by category
        $costByCategory = $project->costs->where('status', 'approved')->groupBy('category')->map(function ($items, $category) {
            return [
                'category' => $category,
                'total' => $items->sum('amount'),
            ];
        })->values();

        // Monthly cash flow for chart
        $monthlyCashFlow = $project->cashFlows
            ->groupBy(function ($item) {
                return $item->transaction_date->format('Y-m');
            })
            ->map(function ($items, $month) {
                return [
                    'month' => $month,
                    'income' => $items->where('type', 'income')->sum('amount'),
                    'expense' => $items->where('type', 'expense')->sum('amount'),
                ];
            })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'project' => $project,
                'summary' => [
                    'total_budget' => $totalBudget,
                    'total_cost_approved' => $totalCostApproved,
                    'total_cost_pending' => $totalCostPending,
                    'budget_remaining' => $totalBudget - $totalCostApproved,
                    'budget_usage_percent' => $totalBudget > 0 ? round(($totalCostApproved / $totalBudget) * 100, 2) : 0,
                    'total_income' => $totalIncome,
                    'total_expense' => $totalExpense,
                    'net_cash_flow' => $totalIncome - $totalExpense,
                    'contracts_count' => $project->contracts->count(),
                    'active_contracts' => $project->contracts->where('status', 'active')->count(),
                ],
                'budget_by_category' => $budgetByCategory,
                'cost_by_category' => $costByCategory,
                'monthly_cash_flow' => $monthlyCashFlow,
            ]
        ]);
    }

    public function update(Request $request, $id)
    {
        $project = Project::where('company_id', $request->user()->company_id)->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|unique:projects,code,' . $id,
            'status' => 'sometimes|in:planning,tender,in_progress,on_hold,completed,cancelled',
            'total_budget' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'project_manager_id' => 'nullable|exists:users,id',
        ]);

        $project->update($request->only([
            'name', 'code', 'description', 'client_name', 'location',
            'status', 'total_budget', 'start_date', 'end_date',
            'actual_start_date', 'actual_end_date', 'project_manager_id',
            'progress_percentage'
        ]));

        $this->logActivity('UPDATE_PROJECT', "Memperbarui data proyek: {$project->name}", $project);

        return response()->json([
            'success' => true,
            'message' => 'Proyek berhasil diperbarui.',
            'data' => $project->load('projectManager:id,name')
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $project = Project::where('company_id', $request->user()->company_id)->findOrFail($id);
        $projectName = $project->name;
        $project->delete();

        $this->logActivity('DELETE_PROJECT', "Menghapus proyek: {$projectName}");

        return response()->json([
            'success' => true,
            'message' => 'Proyek berhasil dihapus.'
        ]);
    }

    // ============================
    // PROJECT DASHBOARD SUMMARY
    // ============================

    public function dashboard(Request $request)
    {
        $companyId = $request->user()->company_id;
        $projects = Project::where('company_id', $companyId)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_projects' => $projects->count(),
                'active_projects' => $projects->where('status', 'in_progress')->count(),
                'completed_projects' => $projects->where('status', 'completed')->count(),
                'planning_projects' => $projects->where('status', 'planning')->count(),
                'total_budget_all' => $projects->sum('total_budget'),
                'total_cost_all' => $projects->sum('total_cost'),
                'on_hold_projects' => $projects->where('status', 'on_hold')->count(),
                'cancelled_projects' => $projects->where('status', 'cancelled')->count(),
            ]
        ]);
    }

    // ============================
    // BUDGET ITEMS
    // ============================

    public function storeBudget(Request $request, $projectId)
    {
        $project = Project::where('company_id', $request->user()->company_id)->findOrFail($projectId);

        $request->validate([
            'category' => 'required|string',
            'item_name' => 'required|string',
            'unit' => 'sometimes|string',
            'volume' => 'required|numeric|min:0',
            'unit_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $budget = $project->budgets()->create($request->only([
            'category', 'item_name', 'unit', 'volume', 'unit_price', 'notes'
        ]));

        $project->recalculate();
        $this->logActivity('ADD_PROJECT_BUDGET', "Menambah RAB ({$budget->item_name}) pada proyek: {$project->name}", $project);

        return response()->json([
            'success' => true,
            'message' => 'Item RAB berhasil ditambahkan.',
            'data' => $budget
        ], 201);
    }

    public function updateBudget(Request $request, $projectId, $budgetId)
    {
        $project = Project::where('company_id', $request->user()->company_id)->findOrFail($projectId);
        $budget = $project->budgets()->findOrFail($budgetId);

        $budget->update($request->only([
            'category', 'item_name', 'unit', 'volume', 'unit_price', 'notes'
        ]));

        $project->recalculate();

        return response()->json([
            'success' => true,
            'message' => 'Item RAB berhasil diperbarui.',
            'data' => $budget
        ]);
    }

    public function destroyBudget(Request $request, $projectId, $budgetId)
    {
        $project = Project::where('company_id', $request->user()->company_id)->findOrFail($projectId);
        $budget = $project->budgets()->findOrFail($budgetId);
        $budget->delete();

        $project->recalculate();

        return response()->json([
            'success' => true,
            'message' => 'Item RAB berhasil dihapus.'
        ]);
    }

    // ============================
    // COST (ACTUAL SPENDING)
    // ============================

    public function storeCost(Request $request, $projectId)
    {
        $project = Project::where('company_id', $request->user()->company_id)->findOrFail($projectId);

        $request->validate([
            'budget_item_id' => 'nullable|exists:project_budgets,id',
            'category' => 'required|string',
            'description' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'cost_date' => 'required|date',
            'vendor' => 'nullable|string',
            'receipt_number' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $cost = $project->costs()->create([
            ...$request->only([
                'budget_item_id', 'category', 'description', 'amount',
                'cost_date', 'vendor', 'receipt_number', 'notes'
            ]),
            'submitted_by' => $request->user()->id,
            'status' => 'pending',
        ]);

        $this->logActivity('SUBMIT_PROJECT_COST', "Mencatat biaya aktual (Rp " . number_format($cost->amount, 0, ',', '.') . ") pada proyek: {$project->name}", $project);

        return response()->json([
            'success' => true,
            'message' => 'Biaya berhasil dicatat.',
            'data' => $cost->load('submitter:id,name')
        ], 201);
    }

    public function approveCost(Request $request, $projectId, $costId)
    {
        $project = Project::where('company_id', $request->user()->company_id)->findOrFail($projectId);
        $cost = $project->costs()->findOrFail($costId);

        $cost->update(['status' => 'approved']);
        $project->recalculate();
        $this->logActivity('APPROVE_PROJECT_COST', "Menyetujui biaya aktual (Rp " . number_format($cost->amount, 0, ',', '.') . ") pada proyek: {$project->name}", $project);

        return response()->json([
            'success' => true,
            'message' => 'Biaya disetujui.'
        ]);
    }

    public function rejectCost(Request $request, $projectId, $costId)
    {
        $project = Project::where('company_id', $request->user()->company_id)->findOrFail($projectId);
        $cost = $project->costs()->findOrFail($costId);

        $cost->update(['status' => 'rejected']);
        $this->logActivity('REJECT_PROJECT_COST', "Menolak biaya aktual pada proyek: {$project->name}", $project);

        return response()->json([
            'success' => true,
            'message' => 'Biaya ditolak.'
        ]);
    }

    // ============================
    // CONTRACTS
    // ============================

    public function storeContract(Request $request, $projectId)
    {
        $project = Project::where('company_id', $request->user()->company_id)->findOrFail($projectId);

        $request->validate([
            'contract_number' => 'required|string|unique:project_contracts,contract_number',
            'title' => 'required|string',
            'vendor_name' => 'required|string',
            'vendor_contact' => 'nullable|string',
            'contract_value' => 'required|numeric|min:0',
            'contract_type' => 'in:main,subcontractor,supplier,consultant',
            'status' => 'in:draft,active,completed,terminated',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'scope_of_work' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $contract = $project->contracts()->create($request->only([
            'contract_number', 'title', 'vendor_name', 'vendor_contact',
            'contract_value', 'contract_type', 'status', 'start_date',
            'end_date', 'scope_of_work', 'notes'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Kontrak berhasil ditambahkan.',
            'data' => $contract
        ], 201);
    }

    public function updateContract(Request $request, $projectId, $contractId)
    {
        $project = Project::where('company_id', $request->user()->company_id)->findOrFail($projectId);
        $contract = $project->contracts()->findOrFail($contractId);

        $contract->update($request->only([
            'contract_number', 'title', 'vendor_name', 'vendor_contact',
            'contract_value', 'contract_type', 'status', 'start_date',
            'end_date', 'scope_of_work', 'notes'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Kontrak berhasil diperbarui.',
            'data' => $contract
        ]);
    }

    public function destroyContract(Request $request, $projectId, $contractId)
    {
        $project = Project::where('company_id', $request->user()->company_id)->findOrFail($projectId);
        $contract = $project->contracts()->findOrFail($contractId);
        $contract->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kontrak berhasil dihapus.'
        ]);
    }

    // ============================
    // SCHEDULES
    // ============================

    public function storeSchedule(Request $request, $projectId)
    {
        $project = Project::where('company_id', $request->user()->company_id)->findOrFail($projectId);

        $request->validate([
            'task_name' => 'required|string',
            'description' => 'nullable|string',
            'phase' => 'in:tender,preparation,foundation,structure,finishing,handover,other',
            'planned_start' => 'required|date',
            'planned_end' => 'required|date|after_or_equal:planned_start',
            'progress' => 'nullable|numeric|min:0|max:100',
            'status' => 'in:not_started,in_progress,completed,delayed,cancelled',
            'order' => 'nullable|integer',
            'notes' => 'nullable|string',
        ]);

        $schedule = $project->schedules()->create($request->only([
            'task_name', 'description', 'phase', 'planned_start', 'planned_end',
            'actual_start', 'actual_end', 'progress', 'status', 'order', 'notes'
        ]));

        $project->recalculate();

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil ditambahkan.',
            'data' => $schedule
        ], 201);
    }

    public function updateSchedule(Request $request, $projectId, $scheduleId)
    {
        $project = Project::where('company_id', $request->user()->company_id)->findOrFail($projectId);
        $schedule = $project->schedules()->findOrFail($scheduleId);

        $schedule->update($request->only([
            'task_name', 'description', 'phase', 'planned_start', 'planned_end',
            'actual_start', 'actual_end', 'progress', 'status', 'order', 'notes'
        ]));

        $project->recalculate();

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil diperbarui.',
            'data' => $schedule
        ]);
    }

    public function destroySchedule(Request $request, $projectId, $scheduleId)
    {
        $project = Project::where('company_id', $request->user()->company_id)->findOrFail($projectId);
        $schedule = $project->schedules()->findOrFail($scheduleId);
        $schedule->delete();

        $project->recalculate();

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil dihapus.'
        ]);
    }

    // ============================
    // CASH FLOW
    // ============================

    public function storeCashFlow(Request $request, $projectId)
    {
        $project = Project::where('company_id', $request->user()->company_id)->findOrFail($projectId);

        $request->validate([
            'type' => 'required|in:income,expense',
            'category' => 'required|string',
            'description' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'transaction_date' => 'required|date',
            'reference_number' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $cashFlow = $project->cashFlows()->create($request->only([
            'type', 'category', 'description', 'amount',
            'transaction_date', 'reference_number', 'notes'
        ]));

        $this->logActivity('RECORD_CASH_FLOW', "Mencatat arus kas " . ($cashFlow->type == 'income' ? 'masuk' : 'keluar') . " (Rp " . number_format($cashFlow->amount, 0, ',', '.') . ") pada proyek: {$project->name}", $project);

        return response()->json([
            'success' => true,
            'message' => 'Transaksi kas berhasil dicatat.',
            'data' => $cashFlow
        ], 201);
    }

    public function destroyCashFlow(Request $request, $projectId, $cashFlowId)
    {
        $project = Project::where('company_id', $request->user()->company_id)->findOrFail($projectId);
        $cashFlow = $project->cashFlows()->findOrFail($cashFlowId);
        $cashFlow->delete();

        return response()->json([
            'success' => true,
            'message' => 'Transaksi kas berhasil dihapus.'
        ]);
    }
}
