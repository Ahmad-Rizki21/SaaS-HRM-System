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

// Auth
Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', TenantMiddleware::class])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user()->load(['role.permissions']);
    });

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
    Route::get('/attendance/history', [AttendanceController::class, 'history']);
    Route::get('/attendance/export', [AttendanceController::class, 'export']);

    // Leave
    Route::get('/leave', [LeaveController::class, 'index']);
    Route::post('/leave', [LeaveController::class, 'store']);
    Route::post('/leave/{id}/approve', [LeaveController::class, 'approve']);
    Route::post('/leave/{id}/reject', [LeaveController::class, 'reject']);
    Route::delete('/leave/{id}', [LeaveController::class, 'destroy']);

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
    Route::get('/employees/{id}', [EmployeeController::class, 'show']);
    Route::put('/employees/{id}', [EmployeeController::class, 'update']);
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
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // User Profile Actions
    Route::post('/user/change-password', [AuthController::class, 'changePassword']);
});
