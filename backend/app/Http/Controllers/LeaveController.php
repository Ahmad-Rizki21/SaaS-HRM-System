<?php

namespace App\Http\Controllers;

use App\Models\Leave;
use Illuminate\Http\Request;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $leaves = Leave::where('user_id', $request->user()->id)
            ->orderBy('id', 'desc')
            ->paginate(10);
            
        return response()->json($leaves);
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

        return response()->json([
            'message' => 'Permohonan cuti berhasil diajukan.',
            'data' => $leave
        ]);
    }

    public function approve(Request $request, $id)
    {
        $leave = Leave::findOrFail($id);
        
        // Cek permission (hanya manager/direktur yang bisa approve)
        // Di sini kita bisa tambah logic role, sementara kita allow saja asalkan login
        
        $leave->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
        ]);

        return response()->json(['message' => 'Permohonan cuti disetujui.']);
    }

    public function reject(Request $request, $id)
    {
        $leave = Leave::findOrFail($id);
        
        $leave->update([
            'status' => 'rejected',
            'approved_by' => $request->user()->id,
        ]);

        return response()->json(['message' => 'Permohonan cuti ditolak.']);
    }
}
