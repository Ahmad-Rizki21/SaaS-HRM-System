<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Salary;
use App\Models\PayrollSetting;
use App\Services\PayrollService;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\PayrollExport;
use Barryvdh\DomPDF\Facade\Pdf;

class PayrollController extends Controller
{
    protected $payrollService;

    public function __construct(PayrollService $payrollService)
    {
        $this->payrollService = $payrollService;
    }

    public function getSettings(Request $request)
    {
        $settings = PayrollSetting::firstOrCreate(
            ['company_id' => $request->user()->company_id],
            ['cutoff_day' => 25]
        );
        return response()->json(['data' => $settings]);
    }

    public function updateSettings(Request $request)
    {
        $settings = PayrollSetting::updateOrCreate(
            ['company_id' => $request->user()->company_id],
            $request->all()
        );
        return response()->json(['message' => 'Settings updated', 'data' => $settings]);
    }

    public function generate(Request $request)
    {
        $request->validate([
            'month' => 'required',
            'year' => 'required|integer',
        ]);

        $companyId = $request->user()->company_id;
        $month = Carbon::parse($request->month)->month;
        $year = $request->year;

        // Eager load attendances and overtimes for the specific month to avoid N+1
        $users = User::where('company_id', $companyId)
            ->with(['attendances' => function($q) use ($month, $year) {
                $q->whereMonth('check_in', $month)->whereYear('check_in', $year);
            }])
            ->with(['overtimes' => function($q) use ($month, $year) {
                $q->where('status', 'approved')->whereMonth('date', $month)->whereYear('date', $year);
            }])
            ->get();
        $settings = PayrollSetting::where('company_id', $companyId)->first();

        if (!$settings) {
            return response()->json(['message' => 'Please configure payroll settings first'], 422);
        }

        $processedCount = 0;

        DB::beginTransaction();
        try {
            foreach ($users as $user) {
                // Skip if salary already exists for this month
                $exists = Salary::where([
                    'user_id' => $user->id,
                    'month' => $request->month,
                    'year' => $request->year
                ])->exists();

                if ($exists) continue;

                $basicArr = (float) ($user->basic_salary ?? 0);
                $fixedArr = (float) ($user->fixed_allowance ?? 0);

                // Calculate Total Jam Kerja (Using pre-loaded attendances)
                $attendances = $user->attendances;
                
                $totalWorkMinutes = 0;
                foreach ($attendances as $att) {
                    if ($att->check_in && $att->check_out) {
                        $totalWorkMinutes += Carbon::parse($att->check_in)->diffInMinutes(Carbon::parse($att->check_out));
                    }
                }
                $totalWorkHours = round($totalWorkMinutes / 60, 1);

                // Calculate Overtime (Using pre-loaded approved overtimes)
                $overtimeRecords = $user->overtimes;
                
                $overtimeAmount = 0;
                $totalOvertimeHours = 0;
                foreach ($overtimeRecords as $ot) {
                    $start = Carbon::parse($ot->start_time);
                    $end = Carbon::parse($ot->end_time);
                    $hours = $start->diffInHours($end);
                    $totalOvertimeHours += $hours;
                    $overtimeAmount += ($hours * 30000);
                }
                
                $gross = $basicArr + $fixedArr + $overtimeAmount;

                // Simple BPJS & Tax calculation using Service
                $bpjs = $this->payrollService->calculateBPJS($basicArr, $settings);
                $tax = $this->payrollService->calculatePPh21TER($gross, $user->ptkp_status);

                $net = $gross - $tax - $bpjs['total_deduction_emp'];

                Salary::create([
                    'user_id' => $user->id,
                    'company_id' => $companyId,
                    'month' => $request->month,
                    'year' => $request->year,
                    'basic_salary' => $basicArr,
                    'allowance' => $fixedArr + $overtimeAmount, // Combined or separate? Let's keep it in allowance or separate breakdown
                    'deduction' => $tax + $bpjs['total_deduction_emp'],
                    'net_salary' => $net,
                    'status' => 'paid',
                    'details' => json_encode([
                        'ptkp' => $user->ptkp_status,
                        'tax' => $tax,
                        'bpjs' => $bpjs,
                        'overtime' => $overtimeAmount,
                        'total_work_hours' => $totalWorkHours,
                        'total_overtime_hours' => $totalOvertimeHours,
                        'breakdown' => [
                            'gross' => $gross,
                            'net' => $net
                        ]
                    ])
                ]);

                $processedCount++;
            }
            DB::commit();
            return response()->json(['message' => "Successfully processed $processedCount payroll records."]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to generate payroll', 'error' => $e->getMessage()], 500);
        }
    }

    public function index(Request $request)
    {
        $salaries = Salary::with('user')
            ->where('company_id', $request->user()->company_id)
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get();
            
        return response()->json(['data' => $salaries]);
    }

    public function export(Request $request)
    {
        $month = $request->query('month');
        $year = $request->query('year', date('Y'));
        $companyId = $request->user()->company_id;

        return Excel::download(new PayrollExport($companyId, $month, $year), "payroll_report_{$month}_{$year}.xlsx");
    }

    public function downloadSlip(Request $request, $id)
    {
        $salary = Salary::with(['user', 'user.company', 'user.role'])->findOrFail($id);
        
        $user = $request->user();

        // Fallback for manual token authentication (for mobile downloads)
        if (!$user && $request->has('token')) {
            $token = \Laravel\Sanctum\PersonalAccessToken::findToken($request->token);
            if ($token) {
                $user = $token->tokenable;
            }
        }

        if (!$user) {
            abort(401);
        }
        
        // Ensure user belongs to the same company or is the employee themselves
        if ($salary->company_id !== $user->company_id && $salary->user_id !== $user->id) {
            abort(403);
        }

        $pdf = Pdf::loadView('pdf.payslip', compact('salary'));
        return $pdf->download("slip_gaji_{$salary->user->name}_{$salary->month}_{$salary->year}.pdf");
    }

    public function myPayroll(Request $request)
    {
        $salaries = Salary::where('user_id', $request->user()->id)
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get();

        return response()->json(['data' => $salaries]);
    }
}
