<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\Office;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Exports\AttendanceExport;
use Maatwebsite\Excel\Facades\Excel;
use App\Traits\Notifiable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Str;

class AttendanceController extends Controller
{
    use Notifiable;

    public function checkIn(Request $request)
    {
        $user = $request->user();
        $now = now();
        $today = Carbon::today()->toDateString();
        
        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('check_in', $today)
            ->first();
            
        if ($attendance) {
            return $this->errorResponse('Anda sudah check-in hari ini.', 400);
        }

        // --- 1. Fake GPS Detection ---
        if ($request->is_mocked) {
             return $this->errorResponse('Lokasi Palsu Terdeteksi! Mohon gunakan GPS asli perangkat Anda.', 403);
        }

        // --- 2. Device Binding Check ---
        if ($request->device_id) {
            if (!$user->device_id) {
                // First time using a device, bind it
                $user->update(['device_id' => $request->device_id]);
            } elseif ($user->device_id !== $request->device_id) {
                return $this->errorResponse('HP Anda tidak terdaftar. Mohon hubungi Admin untuk reset Device ID.', 403);
            }
        }

        // --- 3. Liveness Verification check ---
        // (From Frontend Liveness Detection)
        if (!$request->image) {
             return $this->errorResponse('Foto Selfie wajib disertakan untuk absensi.', 400);
        }
        
        // --- 4. Face Match Logic (Placeholder/Basic Check) ---
        // Mencocokkan wajah saat selfie dengan foto profil
        $faceMatch = true; // Default to true if not implementing ML right away
        
        // IF IMPLEMENTING ML Face Recognition:
        // $manager = new FaceRecognitionManager();
        // $faceMatch = $manager->match($user->profile_photo_path, $request->image);
        
        if ($user->profile_photo_path && !$faceMatch) {
             return $this->errorResponse('Wajah tidak cocok dengan profil Anda. Pastikan wajah terlihat jelas!', 403);
        }

        $schedule = Schedule::with('shift')
            ->where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        $status = 'present';
        $shift = $schedule ? $schedule->shift : null;
        
        if ($shift) {
            if ($now->toTimeString() > $shift->start_time) {
                $status = 'late';
            }
        } else {
            $status = 'no_schedule';
        }

        // --- Geofencing Check ---
        $office = Office::find($request->office_id) ?? Office::where('company_id', $user->company_id)->first();
        $company = $user->company;

        $userRoleName = $user->role ? strtolower($user->role->name) : '';
        $isTechnician = str_contains($userRoleName, 'teknisi');

        if (!$isTechnician) {
            // Priority: Office Coords -> Company Coords
            $targetLat = $office?->latitude ?? $company?->latitude ?? null;
            $targetLng = $office?->longitude ?? $company?->longitude ?? null;
            $radius = $office?->radius ?? $company?->radius_meters ?? $company?->default_radius ?? 100;

            if ($targetLat && $targetLng) {
                $distance = $this->calculateDistance(
                    $request->latitude, 
                    $request->longitude, 
                    $targetLat, 
                    $targetLng
                );

                if ($distance > $radius) {
                    return $this->errorResponse("Maaf, Anda berada di luar area kantor ({$distance} meter dari titik kantor). Silakan mendekat!", 400);
                }
            }
        }

        // Handle Image
        $imageName = null;
        if ($request->image) {
            $image = $request->image; // Base64
            $image = str_replace('data:image/png;base64,', '', $image);
            $image = str_replace(' ', '+', $image);
            $imageName = 'attendance/in_' . $user->id . '_' . time() . '.png';
            Storage::disk('public')->put($imageName, base64_decode($image));
        }

        $attendance = Attendance::create([
            'user_id' => $user->id,
            'company_id' => $user->company_id,
            'check_in' => $now,
            'latitude_in' => $request->latitude,
            'longitude_in' => $request->longitude,
            'image_in' => $imageName,
            'status' => $status,
            'office_id' => $office ? $office->id : null,
        ]);
        
        // --- Notifications ---
        
        // 1. Notify the User (Personal)
        $this->notify(
            $user, 
            'BERHASIL ABSEN MASUK', 
            "Anda telah berhasil absen masuk pada pukul {$now->format('H:i')} WIB. Status: " . strtoupper($status),
            $status === 'late' ? 'warning' : 'success'
        );

        // 2. Proactive: Notify Supervisor if LATE
        if ($status === 'late' && $user->supervisor_id) {
            $supervisor = User::find($user->supervisor_id);
            if ($supervisor) {
                $this->notify(
                    $supervisor,
                    'BAWAHAN TERLAMBAT',
                    "Karyawan {$user->name} baru saja absen masuk terlambat (Pukul {$now->format('H:i')}). Status: " . strtoupper($status),
                    'warning',
                    '/dashboard/attendance'
                );
            }
        }

        return $this->successResponse($attendance, 'Check-in berhasil. Status: ' . $status);
    }

    public function checkOut(Request $request)
    {
        $user = $request->user();
        
        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('check_in', Carbon::today())
            ->whereNull('check_out')
            ->first();
            
        if (!$attendance) {
            return $this->errorResponse('Anda belum check-in atau sudah check-out.', 400);
        }

        // --- 1. Fake GPS Check ---
        if ($request->is_mocked) {
             return $this->errorResponse('Lokasi Palsu Terdeteksi! Mohon gunakan GPS asli.', 403);
        }

        // --- 2. Device Binding Check ---
        if ($request->device_id && $user->device_id && $user->device_id !== $request->device_id) {
            return $this->errorResponse('HP Anda tidak terdaftar. Gunakan HP yang sama saat absen masuk.', 403);
        }

        // --- 3. Foto Selfie Check & Face Match Placeholder ---
        if (!$request->image) {
             return $this->errorResponse('Foto Selfie wajib disertakan untuk absensi.', 400);
        }
        
        $faceMatch = true; 
        if ($user->profile_photo_path && !$faceMatch) {
             return $this->errorResponse('Wajah tidak cocok dengan profil Anda.', 403);
        }

        // Handle Image
        $imageName = null;
        if ($request->image) {
            $image = $request->image; // Base64
            $image = str_replace('data:image/png;base64,', '', $image);
            $image = str_replace(' ', '+', $image);
            $imageName = 'attendance/out_' . $user->id . '_' . time() . '.png';
            Storage::disk('public')->put($imageName, base64_decode($image));
        }

        $attendance->update([
            'check_out' => now(),
            'latitude_out' => $request->latitude,
            'longitude_out' => $request->longitude,
            'image_out' => $imageName,
        ]);

        $this->notify(
            $user, 
            'BERHASIL ABSEN KELUAR', 
            "Anda telah berhasil absen keluar pada pukul " . now()->format('H:i') . " WIB. Terima kasih atas kerja keras Anda!",
            'info'
        );

        return $this->successResponse($attendance, 'Check-out berhasil.');
    }

    public function today(Request $request)
    {
        $user = $request->user();
        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('check_in', Carbon::today())
            ->first();

        return $this->successResponse($attendance, 'Status absensi hari ini.');
    }

    public function history(Request $request)
    {
        $query = Attendance::with('user')->where('company_id', $request->user()->company_id);

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

        if ($request->start_date && $request->end_date) {
            $query->whereDate('check_in', '>=', $request->start_date)
                  ->whereDate('check_in', '<=', $request->end_date);
        }

        if ($request->user_id) { // Tambahan filter ID karyawan jika dikirim
            $query->where('user_id', $request->user_id);
        }
            
        $history = $query->orderBy('id', 'desc')->paginate(10);
        return $this->successResponse($history, 'Riwayat absensi berhasil diambil.');
    }

    public function heatmap(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();

        // Security check: Only Admin, HR, or Owner can see the map
        $userRoleName = $user->role ? strtolower($user->role->name) : '';
        if (str_contains($userRoleName, 'karyawan') && !str_contains($userRoleName, 'admin') && !str_contains($userRoleName, 'hr')) {
             return $this->errorResponse('Akses ditolak. Fitur ini hanya untuk Admin/HR.', 403);
        }

        $attendances = Attendance::with('user')
            ->where('company_id', $user->company_id)
            ->whereDate('check_in', Carbon::today())
            ->get();

        return $this->successResponse($attendances, 'Data heatmap absensi hari ini berhasil diambil.');
    }

    public function export(Request $request)
    {
        $user = $request->user();
        $fileName = 'attendance_' . now()->format('Y_m_d_His') . '.xlsx';
        
        return Excel::download(
            new AttendanceExport(
                $user->company_id, 
                $request->user_id, // optional: filter per karyawan
                $request->start_date, 
                $request->end_date
            ), 
            $fileName
        );
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000; // dalam meter

        $latDelta = deg2rad($lat2 - $lat1);
        $lonDelta = deg2rad($lon2 - $lon1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($lonDelta / 2) * sin($lonDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadius * $c);
    }
}
