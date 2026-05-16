<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Leave;
use App\Models\Permit;
use App\Models\Overtime;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendApprovalReminder extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'approvals:remind-pending';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send WhatsApp reminder to supervisors for pending approval requests';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Checking for pending approval requests...");

        // 1. Pending Leaves
        $pendingLeaves = Leave::whereIn('status', ['pending_supervisor', 'pending_hr'])
            ->get()
            ->groupBy(function($item) {
                // Determine who to notify
                if ($item->status === 'pending_supervisor') {
                    return $item->user->supervisor_id;
                }
                // If pending_hr, we might notify specific HR users or all admins
                // For simplicity, let's notify the supervisor first
                return $item->user->supervisor_id;
            });

        // 2. Pending Permits (assuming similar structure)
        // Check if Permit model has status
        $pendingPermits = Permit::whereIn('status', ['pending', 'pending_supervisor', 'pending_hr'])
            ->get()
            ->groupBy(function($item) {
                return $item->user->supervisor_id;
            });

        // Combine all supervisors who need notification
        $supervisorIds = $pendingLeaves->keys()->concat($pendingPermits->keys())->unique()->filter();

        if ($supervisorIds->isEmpty()) {
            $this->info("No pending approvals found.");
            return;
        }

        $count = 0;

        foreach ($supervisorIds as $supervisorId) {
            $supervisor = User::with('company')->find($supervisorId);
            if (!$supervisor || !$supervisor->phone) continue;

            $waService = new WhatsAppService($supervisor->company);
            
            $leafCount = isset($pendingLeaves[$supervisorId]) ? $pendingLeaves[$supervisorId]->count() : 0;
            $permitCount = isset($pendingPermits[$supervisorId]) ? $pendingPermits[$supervisorId]->count() : 0;
            
            $total = $leafCount + $permitCount;
            if ($total === 0) continue;

            $message = "Halo *{$supervisor->name}*,\n\nAda *{$total} permohonan baru* yang membutuhkan persetujuan Anda:\n";
            if ($leafCount > 0) $message .= "- Cuti: {$leafCount} pengajuan\n";
            if ($permitCount > 0) $message .= "- Izin/Sakit: {$permitCount} pengajuan\n";
            
            $message .= "\nMohon segera tinjau melalui Dashboard HRMS. Terima kasih!";

            if ($waService->sendMessage($supervisor->phone, $message)) {
                $count++;
                $this->info("Reminder sent to Supervisor: {$supervisor->name}");
            }
        }

        $this->info("Total reminders sent to supervisors: {$count}");
        Log::info("Approval Reminder: Sent {$count} WhatsApp reminders to supervisors.");
    }
}
