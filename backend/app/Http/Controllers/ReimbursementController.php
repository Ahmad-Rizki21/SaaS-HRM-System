<?php

namespace App\Http\Controllers;

use App\Models\Reimbursement;
use Illuminate\Http\Request;
use App\Traits\Notifiable;

class ReimbursementController extends Controller
{
    use Notifiable;

    public function index(Request $request)
    {
        $query = Reimbursement::with('user');

        $user = $request->user();

        // Roles that can see all data in their company:
        // 7: Super Admin, 2: HRD, 10: Finance, 3: Management, 8: HRD Manager
        $approver_roles = [7, 2, 10, 3, 8];

        if (!in_array($user->role_id, $approver_roles)) {
            $query->where('user_id', $user->id);
        } else {
            // Admins should still only see data from their own company
            $query->where('company_id', $user->company_id);
        }

        $reimbursements = $query->orderBy('id', 'desc')->paginate(10);
        return $this->successResponse($reimbursements, 'Daftar klaim berhasil diambil.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'amount' => 'required|numeric',
            'description' => 'required|string',
            'attachment' => 'nullable|image|max:10240',
        ]);

        $path = null;
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('reimbursements', 'public');
        }

        $reimbursement = Reimbursement::create([
            'company_id' => $request->user()->company_id,
            'user_id' => $request->user()->id,
            'title' => $request->title,
            'amount' => $request->amount,
            'description' => $request->description,
            'attachment' => $path,
            'status' => 'pending',
        ]);

        // 1. Notify the Submitting User (Confirmation)
        $this->notify(
            $request->user(), 
            'PENGAJUAN REIMBURSEMENT', 
            "Klaim reimbursement Anda '{$request->title}' sebesar Rp " . number_format($request->amount, 0, ',', '.') . " telah diajukan.",
            'info',
            '/dashboard/reimbursements'
        );

        // 2. Notify Admins/Approvers/Finance in the same company
        // Approver roles: Super Admin (7), HRD (2), Finance (10), HRD Manager (8)
        $admins = \App\Models\User::where('company_id', $request->user()->company_id)
            ->whereIn('role_id', [7, 2, 10, 8]) 
            ->where('id', '!=', $request->user()->id)
            ->get();

        foreach ($admins as $admin) {
            $this->notify(
                $admin,
                'KLAIM REIMBURSEMENT BARU',
                "Karyawan {$request->user()->name} mengajukan klaim '{$request->title}' sebesar Rp " . number_format($request->amount, 0, ',', '.') . ".",
                'warning',
                '/dashboard/approvals'
            );
        }

        $this->logActivity('SUBMIT_REIMBURSEMENT', "Mengajukan reimbursement '{$request->title}' senilai Rp " . number_format($request->amount, 0, ',', '.'), $reimbursement);

        return $this->successResponse($reimbursement, 'Klaim berhasil diajukan.', 201);
    }

    public function approve(Request $request, $id)
    {
        $reimbursement = Reimbursement::findOrFail($id);
        
        $reimbursement->update([
            'status' => 'approved',
            'remark' => $request->remark
        ]);

        $msg = "Klaim reimbursement Anda '{$reimbursement->title}' sebesar Rp " . number_format($reimbursement->amount, 0, ',', '.') . " telah DISETUJUI.";
        if ($request->remark) {
            $msg .= " Catatan: {$request->remark}";
        }

        $this->notify(
            $reimbursement->user, 
            'REIMBURSEMENT DISETUJUI', 
            $msg,
            'success',
            '/dashboard/reimbursements'
        );
        
        $this->logActivity('APPROVE_REIMBURSEMENT', "Menyetujui klaim '{$reimbursement->title}' dari {$reimbursement->user->name}", $reimbursement);

        return $this->successResponse($reimbursement, 'Klaim disetujui.');
    }

    public function reject(Request $request, $id)
    {
        $reimbursement = Reimbursement::findOrFail($id);
        
        $reimbursement->update([
            'status' => 'rejected',
            'remark' => $request->remark
        ]);

        $msg = "Mohon maaf, klaim reimbursement Anda '{$reimbursement->title}' telah DITOLAK.";
        if ($request->remark) {
            $msg .= " Alasan: {$request->remark}";
        }

        $this->notify(
            $reimbursement->user, 
            'REIMBURSEMENT DITOLAK', 
            $msg,
            'danger',
            '/dashboard/reimbursements'
        );
        
        $this->logActivity('REJECT_REIMBURSEMENT', "Menolak klaim '{$reimbursement->title}' dari {$reimbursement->user->name}", $reimbursement);

        return $this->successResponse($reimbursement, 'Klaim ditolak.');
    }

    public function destroy(Request $request, $id)
    {
        $reimbursement = Reimbursement::findOrFail($id);

        if ($reimbursement->status !== 'pending') {
            return $this->errorResponse('Klaim yang sudah diproses tidak bisa dihapus.', 403);
        }

        $id_deleted = $reimbursement->id;
        $title_deleted = $reimbursement->title;
        $reimbursement->delete();

        $this->logActivity('DELETE_REIMBURSEMENT', "Menghapus pengajuan reimbursement '{$title_deleted}' (ID: {$id_deleted})");

        return $this->successResponse(null, 'Klaim berhasil dihapus.');
    }
}
