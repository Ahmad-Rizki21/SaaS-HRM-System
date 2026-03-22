<?php

namespace App\Http\Controllers;

use App\Models\Leave;
use Illuminate\Http\Request;
use App\Traits\Notifiable;
use Illuminate\Support\Facades\Mail;
use App\Mail\LeaveNotification;

class LeaveController extends Controller
{
    use Notifiable;

    public function index(Request $request)
    {
        $query = Leave::with('user');

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

        $leaves = $query->orderBy('id', 'desc')->paginate(10);
            
        return $this->successResponse($leaves, 'Data cuti berhasil diambil.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'type' => 'required|string',
            'reason' => 'nullable|string',
            'signature' => 'required|string', // Base64 signature
        ]);

        $leave = Leave::create([
            'user_id' => $request->user()->id,
            'company_id' => $request->user()->company_id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'type' => $request->type,
            'reason' => $request->reason,
            'signature' => $request->signature,
            'status' => 'pending',
        ]);

        $this->notify(
            $request->user(), 
            'PENGAJUAN CUTI BERHASIL', 
            "Permohonan cuti ({$request->type}) Anda dari tanggal {$request->start_date} s/d {$request->end_date} telah diajukan dan sedang menunggu persetujuan.",
            'info'
        );

        // 1. Notify the User's Immediate Supervisor
        if ($request->user()->supervisor_id) {
            $supervisor = $request->user()->supervisor;
            if ($supervisor) {
                $this->notify(
                    $supervisor,
                    'PENGAJUAN CUTI BAWAHAN',
                    "{$request->user()->name} telah mengajukan cuti ({$request->type}) pada {$request->start_date}. Mohon segera tinjau.",
                    'warning',
                    '/dashboard/approvals'
                );
            }
        }

        // 2. Notify Admins and HR (Fallback or Additional)
        $admins = \App\Models\User::where('company_id', $request->user()->company_id)
            ->where('role_id', '>', 1) // Any role above Karyawan
            ->where('id', '!=', $request->user()->supervisor_id) // Don't notify twice if supervisor is also admin
            ->get();
            
        foreach ($admins as $admin) {
            $this->notify(
                $admin,
                'PENGAJUAN CUTI BARU (ADMIN)',
                "{$request->user()->name} telah mengajukan cuti ({$request->type}) pada {$request->start_date}.",
                'warning'
            );
        }

        return $this->successResponse($leave, 'Permohonan cuti berhasil diajukan.', 201);
    }

    public function approve(Request $request, $id)
    {
        abort_if(!$request->user()->hasPermission('approve-leaves'), 403, 'Akses ditolak.');
        $leave = Leave::findOrFail($id);
        
        $leave->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'remark' => $request->remark,
        ]);

        $this->notify(
            $leave->user, 
            'CUTI DISETUJUI', 
            "Permohonan cuti Anda untuk tanggal {$leave->start_date} s/d {$leave->end_date} telah DISETUJUI oleh Admin.",
            'success'
        );

        // Real-time Push Notification (FCM)
        \App\Services\FCMService::sendNotification(
            $leave->user, 
            'Permohonan Cuti Disetujui', 
            "Cuti Anda untuk tanggal {$leave->start_date} s/d {$leave->end_date} telah DISETUJUI."
        );

        try {
            Mail::to($leave->user->email)->send(new LeaveNotification($leave, 'Disetujui'));
        } catch (\Exception $e) {}

        return $this->successResponse(null, 'Permohonan cuti disetujui.');
    }

    public function reject(Request $request, $id)
    {
        abort_if(!$request->user()->hasPermission('approve-leaves'), 403, 'Akses ditolak.');
        $leave = Leave::findOrFail($id);
        
        $leave->update([
            'status' => 'rejected',
            'approved_by' => $request->user()->id,
            'remark' => $request->remark,
        ]);

        $this->notify(
            $leave->user, 
            'CUTI DITOLAK', 
            "Mohon maaf, permohonan cuti Anda untuk tanggal {$leave->start_date} s/d {$leave->end_date} telah DITOLAK.",
            'danger'
        );

        // Real-time Push Notification (FCM)
        \App\Services\FCMService::sendNotification(
            $leave->user, 
            'Permohonan Cuti Ditolak', 
            "Mohon maaf, cuti Anda untuk tanggal {$leave->start_date} s/d {$leave->end_date} telah DITOLAK."
        );

        try {
            Mail::to($leave->user->email)->send(new LeaveNotification($leave, 'Ditolak'));
        } catch (\Exception $e) {}

        return $this->successResponse(null, 'Permohonan cuti ditolak.');
    }

    public function destroy(Request $request, $id)
    {
        $leave = Leave::findOrFail($id);

        if ($leave->status !== 'pending') {
            return $this->errorResponse('Cuti yang sudah diproses tidak bisa dihapus.', 403);
        }

        $leave->delete();
        return $this->successResponse(null, 'Cuti berhasil dihapus.');
    }
}
