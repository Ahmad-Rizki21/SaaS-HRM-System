<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Leave;
use App\Models\Overtime;
use App\Models\Reimbursement;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use App\Traits\Notifiable;

class ManagerController extends Controller
{
    use Notifiable;

    /**
     * Get summary count for pending requests
     */
    public function getPendingCount()
    {
        $userId = Auth::id();
        $subordinateIds = User::where('supervisor_id', $userId)->pluck('id');

        $leaveCount = Leave::whereIn('user_id', $subordinateIds)->where('status', 'pending')->count();
        $overtimeCount = Overtime::whereIn('user_id', $subordinateIds)->where('status', 'pending')->count();
        $reimbursementCount = Reimbursement::whereIn('user_id', $subordinateIds)->where('status', 'pending')->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'leave' => $leaveCount,
                'overtime' => $overtimeCount,
                'reimbursement' => $reimbursementCount,
                'total' => $leaveCount + $overtimeCount + $reimbursementCount
            ]
        ]);
    }

    /**
     * Get list of pending requests by type
     */
    public function getPendingRequests(Request $request)
    {
        $userId = Auth::id();
        $subordinateIds = User::where('supervisor_id', $userId)->pluck('id');
        $type = $request->type; // leave, overtime, reimbursement

        $query = match($type) {
            'leave' => Leave::with('user')->whereIn('user_id', $subordinateIds)->where('status', 'pending'),
            'overtime' => Overtime::with('user')->whereIn('user_id', $subordinateIds)->where('status', 'pending'),
            'reimbursement' => Reimbursement::with('user')->whereIn('user_id', $subordinateIds)->where('status', 'pending'),
            default => null
        };

        if (!$query) {
            return response()->json(['status' => 'error', 'message' => 'Invalid request type'], 400);
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->orderBy('created_at', 'desc')->get()
        ]);
    }

    /**
     * Approve or Reject a request
     */
    public function updateRequestStatus(Request $request)
    {
        $request->validate([
            'type' => 'required|in:leave,overtime,reimbursement',
            'id' => 'required|integer',
            'status' => 'required|in:approved,rejected',
            'remark' => 'nullable|string'
        ]);

        $userId = Auth::id();
        $subordinateIds = User::where('supervisor_id', $userId)->pluck('id');

        $model = match($request->type) {
            'leave' => Leave::class,
            'overtime' => Overtime::class,
            'reimbursement' => Reimbursement::class,
        };

        $item = $model::where('id', $request->id)->whereIn('user_id', $subordinateIds)->first();

        if (!$item) {
            return response()->json(['status' => 'error', 'message' => 'Request not found or not authorized'], 404);
        }

        $item->update([
            'status' => $request->status,
            'approved_by' => $userId,
            'remark' => $request->remark
        ]);

        // Notify the Employee
        $statusText = strtoupper($request->status === 'approved' ? 'DISETUJUI' : 'DITOLAK');
        $typeText = match($request->type) {
            'leave' => 'Cuti',
            'overtime' => 'Lembur',
            'reimbursement' => 'Reimbursement',
        };

        $this->notify(
            $item->user,
            "PENGAJUAN {$typeText} {$statusText}",
            "Pengajuan {$typeText} Anda telah {$statusText} oleh Manager." . ($request->remark ? " Catatan: {$request->remark}" : ""),
            $request->status === 'approved' ? 'success' : 'danger',
            $request->type === 'leave' ? '/dashboard/leaves' : ($request->type === 'overtime' ? '/dashboard/overtimes' : '/dashboard/reimbursements')
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Request successfully ' . $request->status,
            'data' => $item
        ]);
    }

    /**
     * Get team attendance status for today
     */
    public function getTeamAttendance()
    {
        $userId = Auth::id();
        $subordinates = User::where('supervisor_id', $userId)->with(['role'])->get();
        $today = Carbon::today()->toDateString();

        $teamAttendance = $subordinates->map(function($sub) use ($today) {
            $attendance = Attendance::where('user_id', $sub->id)
                ->whereDate('check_in', $today)
                ->first();

            return [
                'id' => $sub->id,
                'name' => $sub->name,
                'role' => $sub->role?->name,
                'photo_url' => $sub->profile_photo_url,
                'status' => $attendance ? ($attendance->check_out ? 'Selesai' : 'Hadir') : 'Belum Masuk',
                'check_in' => $attendance?->check_in ? Carbon::parse($attendance->check_in)->format('H:i') : null,
                'check_out' => $attendance?->check_out ? Carbon::parse($attendance->check_out)->format('H:i') : null,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $teamAttendance
        ]);
    }
}
