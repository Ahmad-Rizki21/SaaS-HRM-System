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
        $isStaff = in_array($user->role?->name, ['Staff Karyawan', 'Karyawan', 'Staff']);
        
        if ($user->role_id === 1) {
            // Master Admin View: System-wide Global Aggregate
            $totalEmployees = User::count();
            $presentToday = Attendance::whereDate('check_in', $today)->count();
            $lateToday = Attendance::whereDate('check_in', $today)->where('status', 'late')->count();
            $onLeaveToday = Leave::where('status', 'approved')->whereDate('start_date', '<=', $today)->whereDate('end_date', '>=', $today)->count();
            
            $summary = [
                'total_employees' => $totalEmployees,
                'present_today' => $presentToday,
                'late_today' => $lateToday,
                'on_leave_today' => $onLeaveToday,
                'absent_today' => max($totalEmployees - $presentToday - $onLeaveToday, 0),
            ];
        } else if ($isStaff) {
            // Staff view: Personal stats
            $totalPresent = Attendance::where('user_id', $user->id)
                ->where('status', 'present')
                ->whereMonth('check_in', Carbon::now()->month)
                ->count();
            
            $onLeaveToday = Leave::where('user_id', $user->id)
                ->where('status', 'approved')
                ->whereDate('start_date', '<=', $today)
                ->whereDate('end_date', '>=', $today)
                ->count();

            $summary = [
                'total_employees' => User::where('company_id', $companyId)->count(),
                'present_today' => $totalPresent,
                'late_today' => Attendance::where('user_id', $user->id)->whereDate('check_in', $today)->where('status', 'late')->count(),
                'on_leave_today' => $onLeaveToday,
                'absent_today' => 0,
            ];
        } else {
            // Company Admin view: Company-specific stats
            $totalEmployees = User::where('company_id', $companyId)->count();
            $presentToday = Attendance::where('company_id', $companyId)->whereDate('check_in', $today)->count();
            $lateToday = Attendance::where('company_id', $companyId)->whereDate('check_in', $today)->where('status', 'late')->count();
            $onLeaveToday = Leave::where('company_id', $companyId)->where('status', 'approved')->whereDate('start_date', '<=', $today)->whereDate('end_date', '>=', $today)->count();
            
            $summary = [
                'total_employees' => $totalEmployees,
                'present_today' => $presentToday,
                'late_today' => $lateToday,
                'on_leave_today' => $onLeaveToday,
                'absent_today' => max($totalEmployees - $presentToday - $onLeaveToday, 0),
            ];
        }

        // --- 2. Pending Approvals ---
        if ($isStaff) {
            $pendingLeaves = Leave::where('user_id', $user->id)->where('status', 'pending')->count();
            $pendingOvertimes = Overtime::where('user_id', $user->id)->where('status', 'pending')->count();
            $pendingReimbursements = Reimbursement::where('user_id', $user->id)->where('status', 'pending')->count();
        } else {
            $pendingLeaves = Leave::where('company_id', $companyId)->where('status', 'pending')->count();
            $pendingOvertimes = Overtime::where('company_id', $companyId)->where('status', 'pending')->count();
            $pendingReimbursements = Reimbursement::where('company_id', $companyId)->where('status', 'pending')->count();
        }

        // --- 3. Attendance Trends (Last 7 Days) ---
        $last7Days = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i)->toDateString();
            $query = Attendance::whereDate('check_in', $date);
            
            if ($isStaff) {
                $query->where('user_id', $user->id);
            } else {
                $query->where('company_id', $companyId);
            }
            
            $count = $query->count();
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
        $roleDistribution = [];
        if (!$isStaff) {
            $roleDistribution = DB::table('users')
                ->where('users.company_id', $companyId)
                ->join('roles', 'users.role_id', '=', 'roles.id')
                ->select('roles.name as role', DB::raw('count(*) as count'))
                ->groupBy('roles.name')
                ->get();
        }

        // --- 7. Today's Attendance List ---
        $todayAttendance = [];
        if (!$isStaff) {
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
        }

        // --- 8. Monthly Attendance Stats ---
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();
        $totalWorkDays = $monthStart->diffInDaysFiltered(function(Carbon $date) {
            return !$date->isWeekend();
        }, $monthEnd);

        $monthlyAttendanceQuery = Attendance::whereBetween('check_in', [$monthStart, $monthEnd]);
        
        if ($isStaff) {
            $monthlyAttendanceQuery->where('user_id', $user->id);
            $totalPresentMonth = (clone $monthlyAttendanceQuery)->count();
            $totalLateMonth = (clone $monthlyAttendanceQuery)->where('status', 'late')->count();
        } else {
            $monthlyAttendanceQuery->where('company_id', $companyId);
            $totalPresentMonth = (clone $monthlyAttendanceQuery)->distinct('user_id')->count('user_id');
            $totalLateMonth = (clone $monthlyAttendanceQuery)->where('status', 'late')->count();
        }
        
        // Calculate Total Hours (Simple calculation for demo)
        $totalHours = (clone $monthlyAttendanceQuery)->sum(DB::raw('TIMESTAMPDIFF(HOUR, check_in, check_out)'));

        $attendanceStats = [
            'percentage' => $isStaff ? round(($totalPresentMonth / ($totalWorkDays ?: 1)) * 100, 1) : (User::where('company_id', $companyId)->count() > 0 ? round(($totalPresentMonth / (User::where('company_id', $companyId)->count() * $totalWorkDays ?: 1)) * 100, 1) : 0),
            'late_count' => $totalLateMonth,
            'total_hours' => round($totalHours, 1),
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

        // --- 10. Monthly Attendance Breakdown (Daily present/late for bar chart) ---
        $monthlyBreakdown = [];
        if (!$isStaff) {
            $startOfMonth = Carbon::now()->startOfMonth();
            $endOfRange = Carbon::now()->endOfMonth();
            // Only show up to today if mid-month
            if ($endOfRange->isFuture()) {
                $endOfRange = Carbon::today();
            }

            $dailyData = DB::table('attendances')
                ->where('company_id', $companyId)
                ->whereBetween('check_in', [$startOfMonth->toDateString(), $endOfRange->toDateString() . ' 23:59:59'])
                ->select(
                    DB::raw('DATE(check_in) as date'),
                    DB::raw("SUM(CASE WHEN status IN ('present', 'office_hour') THEN 1 ELSE 0 END) as present"),
                    DB::raw("SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late"),
                    DB::raw('COUNT(*) as total')
                )
                ->groupBy(DB::raw('DATE(check_in)'))
                ->orderBy('date')
                ->get();

            foreach ($dailyData as $day) {
                $monthlyBreakdown[] = [
                    'date' => $day->date,
                    'label' => Carbon::parse($day->date)->format('d M'),
                    'present' => (int) $day->present,
                    'late' => (int) $day->late,
                    'total' => (int) $day->total,
                ];
            }
        }

        // --- 11. Overtime Monthly Summary (weekly aggregated) ---
        $overtimeSummary = [];
        if (!$isStaff) {
            $overtimeData = DB::table('overtimes')
                ->where('company_id', $companyId)
                ->where('status', 'approved')
                ->whereBetween('date', [$monthStart->toDateString(), Carbon::now()->endOfMonth()->toDateString()])
                ->select(
                    DB::raw('WEEK(date, 1) as week_num'),
                    DB::raw('MIN(date) as week_start'),
                    DB::raw('COUNT(*) as total_requests'),
                    DB::raw('SUM(TIMESTAMPDIFF(HOUR, start_time, end_time)) as total_hours')
                )
                ->groupBy(DB::raw('WEEK(date, 1)'))
                ->orderBy('week_num')
                ->get();

            $weekIndex = 1;
            foreach ($overtimeData as $week) {
                $overtimeSummary[] = [
                    'week' => 'Minggu ' . $weekIndex,
                    'total_requests' => (int) $week->total_requests,
                    'total_hours' => (int) ($week->total_hours ?? 0),
                ];
                $weekIndex++;
            }
        }

        // --- 12. Leave Type Distribution ---
        $leaveDistribution = [];
        if (!$isStaff) {
            $leaveDistribution = DB::table('leaves')
                ->where('company_id', $companyId)
                ->where('status', 'approved')
                ->whereBetween('start_date', [$monthStart->toDateString(), Carbon::now()->endOfMonth()->toDateString()])
                ->select('type', DB::raw('COUNT(*) as count'))
                ->groupBy('type')
                ->get()
                ->map(function ($item) {
                    return [
                        'type' => ucfirst($item->type ?? 'Lainnya'),
                        'count' => (int) $item->count,
                    ];
                });
        }

        return $this->successResponse([
            'summary' => $summary,
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
            'today_attendance' => $todayAttendance,
            'monthly_breakdown' => $monthlyBreakdown,
            'overtime_summary' => $overtimeSummary,
            'leave_distribution' => $leaveDistribution,
        ], 'Data ringkasan dashboard berhasil diambil.');
    }

    public function leaderboard(Request $request)
    {
        $companyId = $request->user()->company_id;
        $now = Carbon::now();
        
        // Key Cache dinamis berdasarkan bulan ini
        $cacheKey = "leaderboard_full_v2_company_{$companyId}_{$now->format('Y-m')}";
        
        $data = \Illuminate\Support\Facades\Cache::remember($cacheKey, 7200, function () use ($companyId, $now) {
            $monthStart = $now->copy()->startOfMonth()->toDateString();
            $monthEnd = $now->copy()->endOfMonth()->toDateString();
            
            // 1. Ambil Attendance (April)
            $topAttendance = $this->getTopAttendance($companyId, $monthStart, $monthEnd);
            $topOvertime = $this->getTopOvertime($companyId, $monthStart, $monthEnd);
            $monthLabel = $now->translatedFormat('F Y');

            // 2. Jika absen kosong, coba mundur ke bulan lalu (Maret)
            if ($topAttendance->isEmpty() && $topOvertime->isEmpty()) {
                $targetMonth = $now->copy()->subMonth();
                $monthStart = $targetMonth->startOfMonth()->toDateString();
                $monthEnd = $targetMonth->endOfMonth()->toDateString();
                
                $topAttendance = $this->getTopAttendance($companyId, $monthStart, $monthEnd);
                $topOvertime = $this->getTopOvertime($companyId, $monthStart, $monthEnd);
                $monthLabel = $targetMonth->translatedFormat('F Y');
            }

            return [
                'top_attendance' => $topAttendance,
                'top_overtime' => $topOvertime,
                'month' => $monthLabel
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Leaderboard berhasil diambil',
            'data' => $data
        ]);
    }

    private function getTopAttendance($companyId, $start, $end)
    {
        return DB::table('attendances')
            ->join('users', 'attendances.user_id', '=', 'users.id')
            ->where('attendances.company_id', $companyId)
            ->whereIn('attendances.status', ['present', 'late', 'office_hour'])
            ->whereBetween('attendances.check_in', [$start, $end . ' 23:59:59'])
            ->select('users.id', 'users.name', 'users.profile_photo_path', DB::raw('COUNT(attendances.id) as score'))
            ->groupBy('users.id', 'users.name', 'users.profile_photo_path')
            ->orderByDesc('score')->take(10)->get()
            ->map(function ($e) {
                $e->photo_url = $e->profile_photo_path ? url('storage/' . $e->profile_photo_path) : null;
                return $e;
            })->values();
    }

    private function getTopOvertime($companyId, $start, $end)
    {
        return DB::table('overtimes')
            ->join('users', 'overtimes.user_id', '=', 'users.id')
            ->where('overtimes.company_id', $companyId)
            ->where('overtimes.status', 'approved')
            ->whereBetween('overtimes.date', [$start, $end])
            ->select('users.id', 'users.name', 'users.profile_photo_path', DB::raw('COUNT(overtimes.id) as score'))
            ->groupBy('users.id', 'users.name', 'users.profile_photo_path')
            ->orderByDesc('score')->take(10)->get()
            ->map(function ($e) {
                $e->photo_url = $e->profile_photo_path ? url('storage/' . $e->profile_photo_path) : null;
                return $e;
            })->values();
    }
}
