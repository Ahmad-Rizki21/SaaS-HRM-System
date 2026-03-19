<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Exports\AttendanceExport;
use Maatwebsite\Excel\Facades\Excel;
use App\Traits\Notifiable;

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

        $attendance = Attendance::create([
            'user_id' => $user->id,
            'company_id' => $user->company_id,
            'check_in' => $now,
            'latitude_in' => $request->latitude,
            'longitude_in' => $request->longitude,
            'status' => $status,
            'office_id' => $request->office_id,
        ]);

        $this->notify(
            $user, 
            'BERHASIL ABSEN MASUK', 
            "Anda telah berhasil absen masuk pada pukul {$now->format('H:i')} WIB. Status: " . strtoupper($status),
            $status === 'late' ? 'warning' : 'success'
        );

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

        $attendance->update([
            'check_out' => now(),
            'latitude_out' => $request->latitude,
            'longitude_out' => $request->longitude,
        ]);

        $this->notify(
            $user, 
            'BERHASIL ABSEN KELUAR', 
            "Anda telah berhasil absen keluar pada pukul " . now()->format('H:i') . " WIB. Terima kasih atas kerja keras Anda!",
            'info'
        );

        return $this->successResponse($attendance, 'Check-out berhasil.');
    }

    public function history(Request $request)
    {
        $query = Attendance::with('user')->where('company_id', $request->user()->company_id);

        // Karyawan hanya bisa melihat absensinya sendiri (Diasumsikan role_id 1 = Karyawan)
        // Jika sistem role kompleks, bisa juga cek hasPermission('view-all-attendance')
        if ($request->user()->role_id == 1) {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('check_in', [$request->start_date, $request->end_date]);
        }
            
        $history = $query->orderBy('id', 'desc')->paginate(10);
        return $this->successResponse($history, 'Riwayat absensi berhasil diambil.');
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
}
