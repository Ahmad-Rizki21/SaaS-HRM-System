<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Middleware\TenantMiddleware;

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ReimbursementController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\ProfileRequestController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\OvertimeController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\ShiftSwapController;
use App\Http\Controllers\ManagerController;
use App\Http\Controllers\PerformanceReviewController;

// Health Check (Docker)
Route::get('/health', function () {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        return response()->json([
            'status' => 'healthy',
            'service' => 'HRMS Narwasthu Group API',
            'database' => 'connected',
            'timestamp' => now()->toISOString(),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'unhealthy',
            'service' => 'HRMS Narwasthu Group API',
            'database' => 'disconnected',
            'error' => $e->getMessage(),
            'timestamp' => now()->toISOString(),
        ], 503);
    }
});

// Auth
Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', TenantMiddleware::class])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [ProfileController::class, 'me']);

    // Dashboard
    Route::get('/dashboard/summary', [DashboardController::class, 'index']);

    // Company Settings
    Route::get('/company', [CompanyController::class, 'show']);
    Route::post('/company/update', [CompanyController::class, 'update']);

    // Shifts
    Route::get('/shifts', [ShiftController::class, 'index']);
    Route::post('/shifts', [ShiftController::class, 'store']);
    Route::put('/shifts/{id}', [ShiftController::class, 'update']);
    Route::delete('/shifts/{id}', [ShiftController::class, 'destroy']);

    // Holidays
    Route::get('/holidays', [HolidayController::class, 'index']);
    Route::post('/holidays', [HolidayController::class, 'store']);
    Route::put('/holidays/{id}', [HolidayController::class, 'update']);
    Route::delete('/holidays/{id}', [HolidayController::class, 'destroy']);

    // Schedules
    Route::get('/schedules', [ScheduleController::class, 'index']);
    Route::post('/schedules', [ScheduleController::class, 'store']);
    Route::delete('/schedules/{id}', [ScheduleController::class, 'destroy']);

    // Attendance
    Route::post('/attendance/check-in', [AttendanceController::class, 'checkIn']);
    Route::post('/attendance/check-out', [AttendanceController::class, 'checkOut']);
    Route::get('/attendance/today', [AttendanceController::class, 'today']);
    Route::get('/attendance/history', [AttendanceController::class, 'history']);
    Route::get('/attendance/heatmap', [AttendanceController::class, 'heatmap']);
    Route::get('/attendance/export', [AttendanceController::class, 'export']);

    // Leave
    Route::get('/leave', [LeaveController::class, 'index']);
    Route::post('/leave', [LeaveController::class, 'store']);
    Route::post('/leave/{id}/approve', [LeaveController::class, 'approve']);
    Route::post('/leave/{id}/reject', [LeaveController::class, 'reject']);
    Route::delete('/leave/{id}', [LeaveController::class, 'destroy']);

    // Overtimes
    Route::get('/overtimes/export', [\App\Http\Controllers\OvertimeController::class, 'export']);
    Route::get('/overtimes', [OvertimeController::class, 'index']);
    Route::post('/overtimes', [OvertimeController::class, 'store']);
    Route::post('/overtimes/{id}/approve', [OvertimeController::class, 'approve']);
    Route::post('/overtimes/{id}/reject', [OvertimeController::class, 'reject']);
    Route::delete('/overtimes/{id}', [OvertimeController::class, 'destroy']);

    // Reimbursements
    Route::get('/reimbursements', [ReimbursementController::class, 'index']);
    Route::post('/reimbursements', [ReimbursementController::class, 'store']);
    Route::post('/reimbursements/{id}/approve', [ReimbursementController::class, 'approve']);
    Route::post('/reimbursements/{id}/reject', [ReimbursementController::class, 'reject']);
    Route::delete('/reimbursements/{id}', [ReimbursementController::class, 'destroy']);

    // Announcements
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::post('/announcements', [AnnouncementController::class, 'store']);
    Route::put('/announcements/{id}', [AnnouncementController::class, 'update']);
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);

    // Activity Logs
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);

    // Employees (Manage Employee)
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::post('/employees', [EmployeeController::class, 'store']);
    Route::post('/employees/import', [EmployeeController::class, 'import']);
    Route::get('/employees/{id}', [EmployeeController::class, 'show']);
    Route::put('/employees/{id}', [EmployeeController::class, 'update']);
    // Bulk Delete
    Route::post('/employees/bulk-delete', [EmployeeController::class, 'bulkDestroy']);
    Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);

    // Roles & Permissions
    Route::get('/roles', [RoleController::class, 'index']);
    Route::post('/roles', [RoleController::class, 'store']);
    Route::get('/roles/{id}', [RoleController::class, 'show']);
    Route::put('/roles/{id}', [RoleController::class, 'update']);
    Route::delete('/roles/{id}', [RoleController::class, 'destroy']);
    Route::get('/permissions', [RoleController::class, 'permissions']);
    Route::post('/roles/{id}/permissions', [RoleController::class, 'syncPermissions']);

    // Profile Update Requests
    Route::get('/profile-requests', [ProfileRequestController::class, 'index']);
    Route::post('/profile-requests', [ProfileRequestController::class, 'store']);
    Route::post('/profile-requests/{id}/approve', [ProfileRequestController::class, 'approve']);
    Route::post('/profile-requests/{id}/reject', [ProfileRequestController::class, 'reject']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/fcm-token', [NotificationController::class, 'updateFCMToken']);
    Route::post('/notifications-clear', [NotificationController::class, 'destroyAll']);

    // Salary (Gaji)
    Route::get('/salary', [SalaryController::class, 'index']);

    // Tasks (Tugas)
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks/{id}/status', [TaskController::class, 'updateStatus']);

    // KPI Reviews (Previously Performance)
    Route::get('/kpi-reviews', [PerformanceReviewController::class, 'index']);
    Route::post('/kpi-reviews', [PerformanceReviewController::class, 'store']);
    Route::get('/kpi-reviews/{id}', [PerformanceReviewController::class, 'show']);
    Route::put('/kpi-reviews/{id}', [PerformanceReviewController::class, 'update']);
    Route::delete('/kpi-reviews/{id}', [PerformanceReviewController::class, 'destroy']);

    // Managerial Routes
    Route::group(['prefix' => 'manager'], function () {
        Route::get('/pending-count', [ManagerController::class, 'getPendingCount']);
        Route::get('/pending-requests', [ManagerController::class, 'getPendingRequests']);
        Route::post('/update-status', [ManagerController::class, 'updateRequestStatus']);
        Route::get('/team-attendance', [ManagerController::class, 'getTeamAttendance']);
    });

    // Profile Settings
    Route::post('/profile/update', [ProfileController::class, 'update']);
    Route::post('/profile/upload-photo', [ProfileController::class, 'uploadPhoto']);
    Route::post('/user/change-password', [AuthController::class, 'changePassword']);

    // Employee Directory & Org Chart
    Route::get('/directory', [EmployeeController::class, 'directory']);
    Route::get('/organization-chart', [\App\Http\Controllers\OrganizationController::class, 'getChart']);

    // Shift Swap (Tukar Shift)
    Route::get('/shift-swap', [ShiftSwapController::class, 'index']);
    Route::post('/shift-swap', [ShiftSwapController::class, 'store']);
    Route::post('/shift-swap/{id}/respond', [ShiftSwapController::class, 'respond']);
    Route::post('/shift-swap/{id}/approve', [ShiftSwapController::class, 'approve']);
    Route::get('/shift-swap/report', [ShiftSwapController::class, 'report']);
    Route::get('/shift-swap/export', [ShiftSwapController::class, 'export']);
});

// Exports (Authenticated via query token or header inside controller)
Route::get('/export/kpi/{id}', [ExportController::class, 'kpiPdf']);
Route::get('/export/leave/{id}', [ExportController::class, 'leavePdf']);
Route::get('/export/reimbursement/{id}', [ExportController::class, 'reimbursementPdf']);
Route::get('/export/overtime/{id}', [ExportController::class, 'overtimePdf']);
