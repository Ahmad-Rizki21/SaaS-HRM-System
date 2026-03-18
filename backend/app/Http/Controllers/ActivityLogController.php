<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = ActivityLog::where('company_id', $request->user()->company_id)
            ->with('user')
            ->orderBy('id', 'desc')
            ->paginate(10);
            
        return $this->successResponse($logs, 'Riwayat aktivitas berhasil diambil.');
    }
}
