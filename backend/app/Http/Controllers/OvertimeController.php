<?php

namespace App\Http\Controllers;

use App\Models\Overtime;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use App\Traits\Notifiable;
use Illuminate\Support\Facades\Log;

class OvertimeController extends Controller
{
    use Notifiable;

    public function index(Request $request)
    {
        $query = Overtime::with(['user', 'approver']);

        $user = $request->user();
        
        // Logic for Data Isolation:
        // 1. Managers/Admin see all company data by default.
        // 2. Staff (non-manager) only sees their own data.
        
        if ($user->is_manager) {
            if ($user->company_id && !$user->canAccessAllCompanies()) {
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
            'start_time' => 'required|string',
            'end_time' => 'required|string',
            'reason' => 'required|string',
        ]);

        $overtime = Overtime::create([
            'user_id' => $request->user()->id,
            'company_id' => $request->user()->company_id,
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        // Log Activity
        ActivityLog::create([
            'user_id' => $request->user()->id,
            'company_id' => $request->user()->company_id,
            'action' => 'OVERTIME_SUBMISSION',
            'description' => "Mengajukan lembur untuk tanggal {$request->date}",
            'model_type' => 'App\Models\Overtime',
            'model_id' => $overtime->id
        ]);

        // 1. Notify the User's Immediate Supervisor
        if ($request->user()->supervisor_id) {
            $supervisor = $request->user()->supervisor;
            if ($supervisor) {
                $this->notify(
                    $supervisor,
                    'PENGAJUAN LEMBUR BAWAHAN',
                    "{$request->user()->name} telah mengajukan lembur pada tanggal {$request->date}. Mohon segera tinjau.",
                    'warning',
                    '/dashboard/approvals'
                );
            }
        }

        // 2. Notify Admins and HR (Fallback or Additional)
        $admins = User::where('company_id', $request->user()->company_id)
            ->where('role_id', '>', 1) // Any role above Karyawan
            ->where('id', '!=', $request->user()->supervisor_id) // Don't notify twice
            ->get();
            
        foreach ($admins as $admin) {
            $this->notify(
                $admin,
                'PENGAJUAN LEMBUR BARU (ADMIN)',
                "{$request->user()->name} telah mengajukan lembur pada tanggal {$request->date}.",
                'warning'
            );
        }

        $this->notify(
            $request->user(), 
            'PENGAJUAN LEMBUR BERHASIL', 
            "Permohonan lembur Anda pada tanggal {$request->date} sedang menunggu persetujuan.",
            'info'
        );

        return $this->successResponse($overtime, 'Permohonan lembur berhasil diajukan.', 201);
    }

    public function approve(Request $request, $id)
    {
        abort_if(!$request->user()->hasPermission('approve-overtimes'), 403, 'Akses ditolak.');
        $overtime = Overtime::findOrFail($id);
        
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
            'model_type' => 'App\Models\Overtime',
            'model_id' => $overtime->id
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
        abort_if(!$request->user()->hasPermission('approve-overtimes'), 403, 'Akses ditolak.');
        $overtime = Overtime::findOrFail($id);
        
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
            'model_type' => 'App\Models\Overtime',
            'model_id' => $overtime->id
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
        abort_if(!$request->user()->hasPermission('delete-overtimes'), 403, 'Akses ditolak.');
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
            'model_type' => 'App\Models\Overtime',
            'model_id' => $overtime->id
        ]);

        $overtime->delete();
        return $this->successResponse(null, 'Permohonan lembur berhasil dihapus.');
    }
}
