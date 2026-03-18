<?php

namespace App\Http\Controllers;

use App\Models\Leave;
use Illuminate\Http\Request;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $query = Leave::with('user');

        // Admin, HRD, Direktur, etc. see all in company. Karyawan sees only theirs.
        if ($request->user()->role_id == 1) { // Karyawan
            $query->where('user_id', $request->user()->id);
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
        ]);

        $leave = Leave::create([
            'user_id' => $request->user()->id,
            'company_id' => $request->user()->company_id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'type' => $request->type,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        return $this->successResponse($leave, 'Permohonan cuti berhasil diajukan.', 201);
    }

    public function approve(Request $request, $id)
    {
        $leave = Leave::findOrFail($id);
        
        $leave->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
        ]);

        return $this->successResponse(null, 'Permohonan cuti disetujui.');
    }

    public function reject(Request $request, $id)
    {
        $leave = Leave::findOrFail($id);
        
        $leave->update([
            'status' => 'rejected',
            'approved_by' => $request->user()->id,
        ]);

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
