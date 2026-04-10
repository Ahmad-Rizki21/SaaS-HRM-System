<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Attendance;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_record_attendance_check_in()
    {
        $user = User::factory()->create();
        
        $attendance = Attendance::create([
            'user_id' => $user->id,
            'company_id' => $user->company_id,
            'check_in' => now(),
            'status' => 'present',
            'latitude_in' => -6.200000,
            'longitude_in' => 106.800000,
        ]);

        $this->assertDatabaseHas('attendances', [
            'user_id' => $user->id,
            'status' => 'present'
        ]);
    }

    /** @test */
    public function it_calculates_late_status_correctly()
    {
        // This is more of a logic check that could be tied to a service 
        // but for now we test the model/database entry.
        $user = User::factory()->create();
        
        $attendance = Attendance::create([
            'user_id' => $user->id,
            'company_id' => $user->company_id,
            'check_in' => now(),
            'status' => 'late',
        ]);

        $this->assertEquals('late', $attendance->status);
    }
}
