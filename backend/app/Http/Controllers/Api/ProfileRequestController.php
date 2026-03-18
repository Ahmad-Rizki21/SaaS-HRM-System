<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProfileRequest;
use App\Models\User;
use Illuminate\Http\Request;

class ProfileRequestController extends Controller
{
    public function index()
    {
        $requests = ProfileRequest::with('user')->where('status', 'pending')->get();
        return response()->json([
            'success' => true,
            'data' => $requests
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        $request->validate([
            'new_data' => 'required|array'
        ]);

        $profileRequest = ProfileRequest::create([
            'user_id' => $user->id,
            'company_id' => $user->company_id,
            'old_data' => $user->only(['name', 'email', 'phone', 'address']),
            'new_data' => $request->new_data, // items like name, phone, address
            'status' => 'pending'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permintaan update profil berhasil dikirim dan menunggu persetujuan.',
            'data' => $profileRequest
        ]);
    }

    public function approve(Request $request, $id)
    {
        $profileRequest = ProfileRequest::findOrFail($id);
        
        $user = User::findOrFail($profileRequest->user_id);
        $user->update($profileRequest->new_data);

        $profileRequest->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Update profil disetujui dan data karyawan telah diperbarui.'
        ]);
    }

    public function reject(Request $request, $id)
    {
        $profileRequest = ProfileRequest::findOrFail($id);
        
        $profileRequest->update([
            'status' => 'rejected',
            'approved_by' => $request->user()->id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Update profil ditolak.'
        ]);
    }
}
