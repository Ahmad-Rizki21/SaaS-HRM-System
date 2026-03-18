<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function checkIn(Request $request)
    {
        $user = $request->user();
        
        // Cek apakah sudah check-in hari ini
        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('check_in', Carbon::today())
            ->first();
            
        if ($attendance) {
            return response()->json(['message' => 'Anda sudah check-in hari ini.'], 400);
        }

        $attendance = Attendance::create([
            'user_id' => $user->id,
            'company_id' => $user->company_id,
            'check_in' => now(),
            'latitude_in' => $request->latitude,
            'longitude_in' => $request->longitude,
            'status' => 'present',
        ]);

        return response()->json([
            'message' => 'Check-in berhasil.',
            'data' => $attendance
        ]);
    }

    public function checkOut(Request $request)
    {
        $user = $request->user();
        
        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('check_in', Carbon::today())
            ->whereNull('check_out')
            ->first();
            
        if (!$attendance) {
            return response()->json(['message' => 'Anda belum check-in atau sudah check-out.'], 400);
        }

        $attendance->update([
            'check_out' => now(),
            'latitude_out' => $request->latitude,
            'longitude_out' => $request->longitude,
        ]);

        return response()->json([
            'message' => 'Check-out berhasil.',
            'data' => $attendance
        ]);
    }

    public function history(Request $request)
    {
        $history = Attendance::where('user_id', $request->user()->id)
            ->orderBy('id', 'desc')
            ->paginate(10);
            
        return response()->json($history);
    }
}
