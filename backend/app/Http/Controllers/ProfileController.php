<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        $sensitiveFields = ['email', 'phone', 'nik'];
        $directFields = ['name', 'address'];

        // 1. Handle Direct Updates
        $user->update($request->only($directFields));

        // 2. Detect Sensitive Changes
        $newData = $request->only($sensitiveFields);
        $changes = [];

        foreach ($newData as $key => $value) {
            if ($value && $user->$key != $value) {
                $changes[$key] = $value;
            }
        }

        if (!empty($changes)) {
            // Create a request for sensitive fields
            \App\Models\ProfileRequest::create([
                'user_id' => $user->id,
                'company_id' => $user->company_id,
                'old_data' => $user->only(array_keys($changes)),
                'new_data' => $changes,
                'status' => 'pending'
            ]);

            return $this->successResponse([
                'user' => $user->fresh()->load('role.permissions'),
                'needs_approval' => true
            ], 'Profil diperbarui, namun perubahan nomor telepon/email memerlukan persetujuan admin.');
        }

        return $this->successResponse([
            'user' => $user->fresh()->load('role')
        ], 'Profil berhasil diperbarui');
    }

    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $user = $request->user();

        // Delete old photo if exists
        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
        }

        // Store new photo
        $path = $request->file('photo')->store('profile-photos', 'public');

        $user->update([
            'profile_photo_path' => $path
        ]);

        return $this->successResponse([
            'profile_photo_url' => asset('storage/' . $path)
        ], 'Foto profil berhasil diperbarui');
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('role.permissions');
        return $this->successResponse([
            'user' => $user
        ]);
    }
}
