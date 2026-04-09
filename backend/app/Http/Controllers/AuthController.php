<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function searchCompanies(Request $request)
    {
        $query = $request->get('q');
        
        $companies = \App\Models\Company::where('name', 'like', "%$query%")
            ->select('id', 'name')
            ->limit(10)
            ->get();

        return $this->successResponse($companies, 'Companies found');
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'company_name' => 'required|string',
        ]);

        $company = \App\Models\Company::where('name', $request->company_name)
            ->orWhere('name', 'like', '%' . $request->company_name . '%')
            ->first();

        if (!$company) {
            return $this->errorResponse('Perusahaan tidak ditemukan.', 404);
        }

        $user = User::where('email', $request->email)
            ->where('company_id', $company->id)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return $this->errorResponse('Kredensial login Anda salah untuk perusahaan ini.', 401);
        }

        // --- Device Binding & FCM Token ---
        $updateData = [];
        if ($request->device_id) {
            if (!$user->device_id) {
                $updateData['device_id'] = $request->device_id;
            } elseif ($user->device_id !== $request->device_id) {
                return $this->errorResponse('Akun Anda terkunci pada perangkat lain. Silakan hubungi Admin untuk reset Device ID Anda.', 403);
            }
        }
        
        if ($request->fcm_token) {
            $updateData['fcm_token'] = $request->fcm_token;
        }

        if (!empty($updateData)) {
            $user->update($updateData);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        \App\Models\ActivityLog::create([
            'company_id' => $user->company_id,
            'user_id' => $user->id,
            'action' => 'LOGIN',
            'description' => "User {$user->name} berhasil masuk ke sistem.",
        ]);

        return $this->successResponse([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load('role.permissions')
        ], 'Login berhasil');
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        $this->logActivity('LOGOUT', "User {$user->name} keluar dari sistem.");
        
        // Clear FCM token on logout for security
        $user->update(['fcm_token' => null]);
        
        $user->currentAccessToken()->delete();

        return $this->successResponse(null, 'Logged out successfully');
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return $this->errorResponse('Kata sandi saat ini salah.', 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        $this->logActivity('CHANGE_PASSWORD', "User {$user->name} telah mengubah kata sandi akunnya.");

        return $this->successResponse(null, 'Kata sandi berhasil diubah.');
    }
    public function verifyEmail($token)
    {
        // Simple token-based verification (base64 encoded email for this example, or a custom field)
        // In a real app, use Illuminate\Auth\Events\Verified or a signed URL
        try {
            $email = base64_decode($token);
            $user = User::where('email', $email)->first();

            if (!$user) {
                return $this->errorResponse('Tautan verifikasi tidak valid.', 404);
            }

            if ($user->email_verified_at) {
                return $this->successResponse(null, 'Email sudah diverifikasi sebelumnya.');
            }

            $user->email_verified_at = now();
            $user->save();

            \App\Models\ActivityLog::create([
                'company_id' => $user->company_id,
                'user_id' => $user->id,
                'action' => 'VERIFY_EMAIL',
                'description' => "User {$user->name} berhasil verifikasi email.",
            ]);

            return $this->successResponse(null, 'Verifikasi email berhasil! Pasword sementara telah aktif.');
        } catch (\Exception $e) {
            return $this->errorResponse('Gagal verifikasi email.', 500);
        }
    }
}
