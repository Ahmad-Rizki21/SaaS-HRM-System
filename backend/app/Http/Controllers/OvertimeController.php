<?php

namespace App\Http\Controllers;

use App\Exports\OvertimeExport;
use App\Models\ActivityLog;
use App\Models\Overtime;
use App\Models\User;
use App\Services\ApprovalService;
use App\Traits\Notifiable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;

class OvertimeController extends Controller
{
    use Notifiable;

    private const MSG_FORBIDDEN = 'Akses ditolak.';
    private const MODEL_OVERTIME = 'App\Models\Overtime';
    private const RULE_REQ_STRING = 'required|string';

    public function index(Request $request)
    {
        $query = Overtime::with(['user', 'approver']);

        $user = $request->user();

        if ($user->is_manager) {
            if ($user->company_id && ! $user->canAccessAllCompanies()) {
                $query->where('company_id', $user->company_id);
            }
        } else {
            $query->where('user_id', $user->id);
        }

        $overtimes = $query->orderBy('id', 'desc')->paginate(10);

        return $this->successResponse($overtimes, 'Data lembur berhasil diambil.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'start_time' => self::RULE_REQ_STRING,
            'end_time' => self::RULE_REQ_STRING,
            'reason' => self::RULE_REQ_STRING,
        ]);

        $user = $request->user();
        $companyId = $user->company_id;

        // ── Dynamic Workflow Check ──
        $workflowResult = ApprovalService::initApproval('overtime', $companyId, $user);

        if ($workflowResult) {
            $overtime = Overtime::create([
                'user_id' => $user->id,
                'company_id' => $companyId,
                'date' => $request->date,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'reason' => $request->reason,
                'status' => $workflowResult['status'],
                'current_approval_step' => $workflowResult['current_approval_step'],
            ]);

            ActivityLog::create([
                'user_id' => $user->id,
                'company_id' => $companyId,
                'action' => 'OVERTIME_SUBMISSION',
                'description' => "Mengajukan lembur untuk tanggal {$request->date}",
                'model_type' => self::MODEL_OVERTIME,
                'model_id' => $overtime->id,
            ]);

            $this->notify($user, 'PENGAJUAN LEMBUR BERHASIL', "Permohonan lembur Anda pada tanggal {$request->date} telah diajukan. Menunggu: {$workflowResult['step_label']}.", 'info');

            foreach ($workflowResult['approvers'] as $approver) {
                $this->notify($approver, 'PENGAJUAN LEMBUR PERLU PERSETUJUAN', "{$user->name} telah mengajukan lembur pada tanggal {$request->date}. Mohon segera tinjau.", 'warning', '/dashboard/approvals');
            }
        } else {
            // ── Fallback: Default logic ──
            $overtime = Overtime::create([
                'user_id' => $user->id,
                'company_id' => $companyId,
                'date' => $request->date,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'reason' => $request->reason,
                'status' => 'pending',
            ]);

            ActivityLog::create([
                'user_id' => $user->id,
                'company_id' => $companyId,
                'action' => 'OVERTIME_SUBMISSION',
                'description' => "Mengajukan lembur untuk tanggal {$request->date}",
                'model_type' => self::MODEL_OVERTIME,
                'model_id' => $overtime->id,
            ]);

            // 1. Notify the User's Immediate Supervisor
            if ($user->supervisor_id) {
                $supervisor = $user->supervisor;
                if ($supervisor) {
                    $this->notify(
                        $supervisor,
                        'PENGAJUAN LEMBUR BAWAHAN',
                        "{$user->name} telah mengajukan lembur pada tanggal {$request->date}. Mohon segera tinjau.",
                        'warning',
                        '/dashboard/approvals'
                    );
                }
            }

            // 2. Notify Admins and HR (Fallback or Additional)
            $admins = User::where('company_id', $companyId)
                ->where('role_id', '>', 1)
                ->where('id', '!=', $user->supervisor_id)
                ->get();

            foreach ($admins as $admin) {
                $this->notify(
                    $admin,
                    'PENGAJUAN LEMBUR BARU (ADMIN)',
                    "{$user->name} telah mengajukan lembur pada tanggal {$request->date}.",
                    'warning'
                );
            }

            $this->notify(
                $user,
                'PENGAJUAN LEMBUR BERHASIL',
                "Permohonan lembur Anda pada tanggal {$request->date} sedang menunggu persetujuan.",
                'info'
            );
        }

        return $this->successResponse($overtime, 'Permohonan lembur berhasil diajukan.', 201);
    }

    public function approve(Request $request, $id)
    {
        $user = $request->user();
        $overtime = Overtime::findOrFail($id);

        // ── Dynamic Workflow Path ──
        if ($overtime->current_approval_step !== null) {
            $result = ApprovalService::processApproval(
                'overtime', $overtime->company_id, $user, $overtime->user, $overtime->current_approval_step, 'approve'
            );

            if ($result === null) {
                return $this->errorResponse('Workflow tidak ditemukan.', 400);
            }
            if (isset($result['error'])) {
                return $this->errorResponse($result['error'], 403);
            }

            $updateData = [
                'status' => $result['status'],
                'current_approval_step' => $result['current_approval_step'],
            ];

            if ($result['is_final'] && $result['status'] === 'approved') {
                $updateData['approved_by'] = $user->id;
                $updateData['remark'] = $request->remark;
            }

            $overtime->update($updateData);

            ActivityLog::create([
                'user_id' => $user->id,
                'company_id' => $user->company_id,
                'action' => 'OVERTIME_APPROVAL',
                'description' => "Menyetujui lembur {$overtime->user->name} tanggal {$overtime->date}",
                'model_type' => self::MODEL_OVERTIME,
                'model_id' => $overtime->id,
            ]);

            if ($result['is_final'] && $result['status'] === 'approved') {
                $this->notify($overtime->user, 'LEMBUR DISETUJUI', "Permohonan lembur Anda pada tanggal {$overtime->date} telah DISETUJUI.", 'success');

                return $this->successResponse($overtime, 'Permohonan lembur disetujui.');
            }

            if (isset($result['approvers'])) {
                foreach ($result['approvers'] as $nextApprover) {
                    $this->notify($nextApprover, 'LEMBUR MENUNGGU PERSETUJUAN', "Pengajuan lembur {$overtime->user->name} menunggu persetujuan Anda. Tahap: {$result['step_label']}.", 'warning', '/dashboard/approvals');
                }
            }
            $this->notify($overtime->user, 'LEMBUR DALAM PROSES', "Pengajuan lembur Anda disetujui di tahap sebelumnya. Menunggu: {$result['step_label']}.", 'info');

            return $this->successResponse($overtime, "Di-approve. Menunggu: {$result['step_label']}.");
        }

        // ── Fallback: Default logic ──
        abort_if(! $request->user()->hasPermission('approve-overtimes'), 403, self::MSG_FORBIDDEN);

        $overtime->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'remark' => $request->remark,
        ]);

        // Log Activity
        ActivityLog::create([
            'user_id' => $request->user()->id,
            'company_id' => $request->user()->company_id,
            'action' => 'OVERTIME_APPROVAL',
            'description' => "Menyetujui lembur {$overtime->user->name} tanggal {$overtime->date}",
            'model_type' => self::MODEL_OVERTIME,
            'model_id' => $overtime->id,
        ]);

        $this->notify(
            $overtime->user,
            'LEMBUR DISETUJUI',
            "Permohonan lembur Anda pada tanggal {$overtime->date} telah DISETUJUI oleh Admin.",
            'success'
        );

        return $this->successResponse($overtime, 'Permohonan lembur disetujui.');
    }

    public function reject(Request $request, $id)
    {
        $user = $request->user();
        $overtime = Overtime::findOrFail($id);

        // ── Dynamic Workflow Path ──
        if ($overtime->current_approval_step !== null) {
            $result = ApprovalService::processApproval(
                'overtime', $overtime->company_id, $user, $overtime->user, $overtime->current_approval_step, 'reject'
            );

            if ($result === null) {
                return $this->errorResponse('Workflow tidak ditemukan.', 400);
            }
            if (isset($result['error'])) {
                return $this->errorResponse($result['error'], 403);
            }

            $overtime->update([
                'status' => 'rejected',
                'current_approval_step' => null,
                'approved_by' => $user->id,
                'remark' => $request->remark,
            ]);

            ActivityLog::create([
                'user_id' => $user->id,
                'company_id' => $user->company_id,
                'action' => 'OVERTIME_REJECTION',
                'description' => "Menolak lembur {$overtime->user->name} tanggal {$overtime->date}",
                'model_type' => self::MODEL_OVERTIME,
                'model_id' => $overtime->id,
            ]);

            $this->notify($overtime->user, 'LEMBUR DITOLAK', "Mohon maaf, permohonan lembur Anda pada tanggal {$overtime->date} telah DITOLAK.", 'danger');

            return $this->successResponse($overtime, 'Permohonan lembur ditolak.');
        }

        // ── Fallback: Default logic ──
        abort_if(! $request->user()->hasPermission('approve-overtimes'), 403, self::MSG_FORBIDDEN);

        $overtime->update([
            'status' => 'rejected',
            'approved_by' => $request->user()->id,
            'remark' => $request->remark,
        ]);

        // Log Activity
        ActivityLog::create([
            'user_id' => $request->user()->id,
            'company_id' => $request->user()->company_id,
            'action' => 'OVERTIME_REJECTION',
            'description' => "Menolak lembur {$overtime->user->name} tanggal {$overtime->date}",
            'model_type' => self::MODEL_OVERTIME,
            'model_id' => $overtime->id,
        ]);

        $this->notify(
            $overtime->user,
            'LEMBUR DITOLAK',
            "Mohon maaf, permohonan lembur Anda pada tanggal {$overtime->date} telah DITOLAK.",
            'danger'
        );

        return $this->successResponse($overtime, 'Permohonan lembur ditolak.');
    }

    public function destroy(Request $request, $id)
    {
        abort_if(! $request->user()->hasPermission('delete-overtimes'), 403, self::MSG_FORBIDDEN);
        $overtime = Overtime::findOrFail($id);

        if ($overtime->status !== 'pending') {
            return $this->errorResponse('Lembur yang sudah diproses tidak bisa dihapus.', 403);
        }

        // Log Activity (Before delete)
        ActivityLog::create([
            'user_id' => $request->user()->id,
            'company_id' => $request->user()->company_id,
            'action' => 'OVERTIME_DELETION',
            'description' => "Menghapus pengajuan lembur tanggal {$overtime->date}",
            'model_type' => self::MODEL_OVERTIME,
            'model_id' => $overtime->id,
        ]);

        $overtime->delete();

        return $this->successResponse(null, 'Permohonan lembur berhasil dihapus.');
    }

    public function export(Request $request)
    {
        $query = Overtime::with(['user', 'approver']);
        $user = $request->user();

        // Isolation logic (same as index)
        if ($user->is_manager) {
            if ($user->company_id && ! $user->canAccessAllCompanies()) {
                $query->where('company_id', $user->company_id);
            }
        } else {
            $query->where('user_id', $user->id);
        }

        // Filtering
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Default to approved if not specified, usually reports are for approved items
        if ($request->status === 'approved') {
            $query->where('status', 'approved');
        }

        $overtimes = $query->orderBy('date', 'asc')->get();

        if ($overtimes->isEmpty()) {
            return response()->json(['message' => 'Tidak ada data lembur untuk diekspor.'], 404);
        }

        $meta = [
            'date_range' => $request->filled('date_range') ? $request->date_range : date('F Y', strtotime($overtimes->first()->date)),
            'office_name' => $user->company?->offices()->first()->name ?? 'KP Cakung',
            'company_name' => $user->company->name ?? 'PT. Narwastu Group',
            'hr_ga' => User::where('company_id', $user->company_id)
                ->whereHas('role', function ($q) {
                    $q->where('name', 'LIKE', '%HR%');
                })->first()->name ?? 'Nazirin Nawawi',
            'today' => now(),
        ];

        return Excel::download(new OvertimeExport($overtimes, $meta), 'laporan-lembur-'.now()->format('Y-m-d').'.xlsx');
    }
}
