<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Middleware\TenantMiddleware;

// Auth
Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', TenantMiddleware::class])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Attendance
    Route::post('/attendance/check-in', function() { return 'Check-in pending'; });
    Route::post('/attendance/check-out', function() { return 'Check-out pending'; });
    Route::get('/attendance/history', function() { return 'History pending'; });

    // Leave
    Route::post('/leave', function() { return 'Create leave pending'; });
    Route::get('/leave', function() { return 'List leave pending'; });
    Route::post('/leave/{id}/approve', function() { return 'Approve pending'; });
    Route::post('/leave/{id}/reject', function() { return 'Reject pending'; });
});
