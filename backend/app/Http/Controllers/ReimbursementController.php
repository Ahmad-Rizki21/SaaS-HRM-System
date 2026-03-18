<?php

namespace App\Http\Controllers;

use App\Models\Reimbursement;
use Illuminate\Http\Request;

class ReimbursementController extends Controller
{
    public function index(Request $request)
    {
        $query = Reimbursement::with('user');

        // Admin sees all in company, Employee sees only theirs
        if ($request->user()->role_id !== 1 && $request->user()->role_id !== 2) {
            $query->where('user_id', $request->user()->id);
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
            'attachment' => 'nullable|image|max:2048',
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

        return $this->successResponse($reimbursement, 'Klaim berhasil diajukan.', 201);
    }

    public function approve(Request $request, $id)
    {
        $reimbursement = Reimbursement::findOrFail($id);
        
        $reimbursement->update(['status' => 'approved']);
        
        return $this->successResponse($reimbursement, 'Klaim disetujui.');
    }

    public function reject(Request $request, $id)
    {
        $reimbursement = Reimbursement::findOrFail($id);
        
        $reimbursement->update(['status' => 'rejected']);
        
        return $this->successResponse($reimbursement, 'Klaim ditolak.');
    }

    public function destroy(Request $request, $id)
    {
        $reimbursement = Reimbursement::findOrFail($id);

        if ($reimbursement->status !== 'pending') {
            return $this->errorResponse('Klaim yang sudah diproses tidak bisa dihapus.', 403);
        }

        $reimbursement->delete();
        return $this->successResponse(null, 'Klaim berhasil dihapus.');
    }
}
