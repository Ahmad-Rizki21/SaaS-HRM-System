<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Leave;
use App\Models\Overtime;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $today = Carbon::today()->toDateString();
        
        $totalEmployees = User::where('company_id', $user->company_id)->count();
        
        $presentToday = Attendance::where('company_id', $user->company_id)
            ->whereDate('check_in', $today)
            ->count();
            
        $lateToday = Attendance::where('company_id', $user->company_id)
            ->whereDate('check_in', $today)
            ->where('status', 'late')
            ->count();
            
        $onLeaveToday = Leave::where('company_id', $user->company_id)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->count();
            
        $absentToday = $totalEmployees - $presentToday - $onLeaveToday;
        $absentToday = max($absentToday, 0); // Safety

        $pendingOvertimes = Overtime::where('company_id', $user->company_id)
            ->where('status', 'pending')
            ->count();

        return $this->successResponse([
            'total_employees' => $totalEmployees,
            'present_today' => $presentToday,
            'late_today' => $lateToday,
            'on_leave_today' => $onLeaveToday,
            'absent_today' => $absentToday,
            'pending_overtimes' => $pendingOvertimes,
        ], 'Data ringkasan dashboard berhasil diambil.');
    }
}
