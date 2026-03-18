<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return $this->errorResponse('Kredensial login Anda salah.', 401);
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
        $this->logActivity('LOGOUT', "User {$request->user()->name} keluar dari sistem.");
        $request->user()->currentAccessToken()->delete();

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
}
