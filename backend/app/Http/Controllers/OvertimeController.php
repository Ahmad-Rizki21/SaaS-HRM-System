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

        // Employees see only their requests, Admin/HR see all in company
        if ($request->user()->role_id == 1) { // 1 = Karyawan
            $query->where('user_id', $request->user()->id);
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

        // Notify Admins, HR, and Super Admin
        $admins = User::where('company_id', $request->user()->company_id)
            ->where('role_id', '>', 1) // Any role above Karyawan
            ->get();
            
        foreach ($admins as $admin) {
            $this->notify(
                $admin,
                'PENGAJUAN LEMBUR BARU',
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
