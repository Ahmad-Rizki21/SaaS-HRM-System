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
            ->with('user:id,role_id,name,profile_photo_path')
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
        $roleDistribution = DB::table('users')
            ->where('users.company_id', $companyId)
            ->join('roles', 'users.role_id', '=', 'roles.id')
            ->select('roles.name as role', DB::raw('count(*) as count'))
            ->groupBy('roles.name')
            ->get();

        // --- 7. Today's Attendance List ---
        $todayAttendance = Attendance::where('company_id', $companyId)
            ->whereDate('check_in', $today)
            ->with('user:id,role_id,name,nik,profile_photo_path')
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

        // --- 8. Monthly Attendance Stats ---
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();
        $totalWorkDays = $monthStart->diffInDaysFiltered(function(Carbon $date) {
            return !$date->isWeekend();
        }, $monthEnd);

        $monthlyAttendance = Attendance::where('company_id', $companyId)
            ->whereBetween('check_in', [$monthStart, $monthEnd]);

        $totalPresentMonth = (clone $monthlyAttendance)->distinct('user_id')->count('user_id');
        $totalLateMonth = (clone $monthlyAttendance)->where('status', 'late')->count();
        
        // Calculate Total Hours (Simple calculation for demo)
        $totalHours = (clone $monthlyAttendance)->sum(DB::raw('TIMESTAMPDIFF(HOUR, check_in, check_out)'));

        $attendanceStats = [
            'percentage' => $totalEmployees > 0 ? round(($totalPresentMonth / ($totalEmployees * $totalWorkDays ?: 1)) * 100, 1) : 0,
            'late_count' => $totalLateMonth,
            'total_hours' => $totalHours,
            'work_days' => $totalWorkDays
        ];

        // --- 9. Calendar Events (Current Month) ---
        $calendarHolidays = Holiday::where('company_id', $companyId)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->get()
            ->map(fn($h) => ['type' => 'holiday', 'title' => $h->name, 'date' => $h->date]);

        $calendarLeaves = Leave::where('company_id', $companyId)
            ->where('status', 'approved')
            ->where(function($q) use ($monthStart, $monthEnd) {
                $q->whereBetween('start_date', [$monthStart, $monthEnd])
                  ->orWhereBetween('end_date', [$monthStart, $monthEnd]);
            })
            ->with('user:id,name')
            ->get()
            ->map(fn($l) => ['type' => 'leave', 'title' => $l->user->name . ' (Cuti)', 'date' => $l->start_date]);

        $calendarEvents = $calendarHolidays->concat($calendarLeaves);

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
            'attendance_stats' => $attendanceStats,
            'calendar_events' => $calendarEvents,
            'upcoming_holidays' => $upcomingHolidays,
            'recent_announcements' => $recentAnnouncements,
            'recent_activities' => $recentActivities,
            'role_distribution' => $roleDistribution,
            'today_attendance' => $todayAttendance
        ], 'Data ringkasan dashboard berhasil diambil.');
    }

    public function leaderboard(Request $request)
    {
        $companyId = $request->user()->company_id;
        $monthStart = Carbon::now()->startOfMonth()->toDateString();
        $monthEnd = Carbon::now()->endOfMonth()->toDateString();

        // Gunakan cache Redis 2 jam (7200 detik) agar tidak membebani database
        $cacheKey = "leaderboard_company_{$companyId}_{$monthStart}";
        
        $topAttendance = \Illuminate\Support\Facades\Cache::remember($cacheKey, 7200, function () use ($companyId, $monthStart, $monthEnd) {
            return DB::table('attendances')
                ->join('users', 'attendances.user_id', '=', 'users.id')
                ->where('attendances.company_id', $companyId)
                ->where('attendances.status', 'present') // "present" biasanya digunakan untuk yang tepat waktu
                ->whereBetween('attendances.check_in', [$monthStart, $monthEnd . ' 23:59:59'])
                ->select(
                    'users.id',
                    'users.name',
                    'users.profile_photo_path',
                    DB::raw('COUNT(attendances.id) as score') // on time count
                )
                ->groupBy('users.id', 'users.name', 'users.profile_photo_path')
                ->orderByDesc('score')
                ->take(3)
                ->get()
                ->map(function ($employee) {
                    $employee->photo_url = $employee->profile_photo_path 
                        ? url('storage/' . $employee->profile_photo_path) 
                        : null;
                    return $employee;
                });
        });

        // Top Overtime (jam lembur)
        $cacheKeyOvertime = "leaderboard_overtime_company_{$companyId}_{$monthStart}";
        
        $topOvertime = \Illuminate\Support\Facades\Cache::remember($cacheKeyOvertime, 7200, function () use ($companyId, $monthStart, $monthEnd) {
            return DB::table('overtimes')
                ->join('users', 'overtimes.user_id', '=', 'users.id')
                ->where('overtimes.company_id', $companyId)
                ->where('overtimes.status', 'approved')
                ->whereBetween('overtimes.date', [$monthStart, $monthEnd])
                ->select(
                    'users.id',
                    'users.name',
                    'users.profile_photo_path',
                    // Menjumlahkan jam lembur menggunakan TIMESTAMPDIFF atau perhitungan jam sederhananya (jumlah surat lembur / total jam)
                    // Karena sqlite/mysql beda fungsi,nyari aman guee pake COUNT approval atau SUM jam
                    DB::raw('COUNT(overtimes.id) as score') 
                )
                ->groupBy('users.id', 'users.name', 'users.profile_photo_path')
                ->orderByDesc('score')
                ->take(3)
                ->get()
                ->map(function ($employee) {
                    $employee->photo_url = $employee->profile_photo_path 
                        ? url('storage/' . $employee->profile_photo_path) 
                        : null;
                    return $employee;
                });
        });

        return response()->json([
            'success' => true,
            'message' => 'Leaderboard bulan ini berhasil diambil',
            'data' => [
                'top_attendance' => $topAttendance,
                'top_overtime' => $topOvertime,
                'month' => Carbon::now()->translatedFormat('F Y'),
            ]
        ]);
    }
}
