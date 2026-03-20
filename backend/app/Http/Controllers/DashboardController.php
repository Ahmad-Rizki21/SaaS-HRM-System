<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Announcement;
use App\Models\Attendance;
use App\Models\Holiday;
use App\Models\Leave;
use App\Models\Overtime;
use App\Models\Reimbursement;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $today = Carbon::today()->toDateString();
        $companyId = $user->company_id;
        
        // --- 1. Top Statistics ---
        $totalEmployees = User::where('company_id', $companyId)->count();
        
        $presentToday = Attendance::where('company_id', $companyId)
            ->whereDate('check_in', $today)
            ->count();
            
        $lateToday = Attendance::where('company_id', $companyId)
            ->whereDate('check_in', $today)
            ->where('status', 'late')
            ->count();
            
        $onLeaveToday = Leave::where('company_id', $companyId)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->count();
            
        $absentToday = max($totalEmployees - $presentToday - $onLeaveToday, 0);

        // --- 2. Pending Approvals ---
        $pendingLeaves = Leave::where('company_id', $companyId)->where('status', 'pending')->count();
        $pendingOvertimes = Overtime::where('company_id', $companyId)->where('status', 'pending')->count();
        $pendingReimbursements = Reimbursement::where('company_id', $companyId)->where('status', 'pending')->count();

        // --- 3. Attendance Trends (Last 7 Days) ---
        $last7Days = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i)->toDateString();
            $count = Attendance::where('company_id', $companyId)
                ->whereDate('check_in', $date)
                ->count();
            $last7Days[] = [
                'date' => $date,
                'day' => Carbon::parse($date)->format('D'),
                'count' => $count
            ];
        }

        // --- 4. Upcoming Items ---
        $upcomingHolidays = Holiday::where('company_id', $companyId)
            ->whereDate('date', '>=', $today)
            ->orderBy('date', 'asc')
            ->limit(5)
            ->get();

        $recentAnnouncements = Announcement::where('company_id', $companyId)
            ->with('user:id,name')
            ->latest()
            ->limit(5)
            ->get();

        // --- 5. Recent Activity ---
        $recentActivities = ActivityLog::where('company_id', $companyId)
            ->with('user:id,name,profile_photo_path')
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user_name' => $log->user->name ?? 'System',
                    'action' => $log->action,
                    'description' => $log->description,
                    'time' => $log->created_at->diffForHumans(),
                    'photo_url' => $log->user->profile_photo_url ?? null
                ];
            });

        // --- 6. Employee Distribution by Role ---
        $roleDistribution = User::where('company_id', $companyId)
            ->join('roles', 'users.role_id', '=', 'roles.id')
            ->select('roles.name as role', DB::raw('count(*) as count'))
            ->groupBy('roles.name')
            ->get();

        // --- 7. Today's Attendance List ---
        $todayAttendance = Attendance::where('company_id', $companyId)
            ->whereDate('check_in', $today)
            ->with('user:id,name,nik,profile_photo_path')
            ->latest('check_in')
            ->limit(10)
            ->get()
            ->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'user_name' => $attendance->user->name,
                    'nik' => $attendance->user->nik,
                    'check_in' => $attendance->check_in ? Carbon::parse($attendance->check_in)->format('H:i') : '-',
                    'status' => $attendance->status,
                    'photo_url' => $attendance->user->profile_photo_url
                ];
            });

        return $this->successResponse([
            'summary' => [
                'total_employees' => $totalEmployees,
                'present_today' => $presentToday,
                'late_today' => $lateToday,
                'on_leave_today' => $onLeaveToday,
                'absent_today' => $absentToday,
            ],
            'pending_approvals' => [
                'leaves' => $pendingLeaves,
                'overtimes' => $pendingOvertimes,
                'reimbursements' => $pendingReimbursements,
            ],
            'attendance_trends' => $last7Days,
            'upcoming_holidays' => $upcomingHolidays,
            'recent_announcements' => $recentAnnouncements,
            'recent_activities' => $recentActivities,
            'role_distribution' => $roleDistribution,
            'today_attendance' => $todayAttendance
        ], 'Data ringkasan dashboard berhasil diambil.');
    }
}
