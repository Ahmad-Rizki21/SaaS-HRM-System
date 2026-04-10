<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Permit;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PermitTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_create_a_permit_request()
    {
        $user = User::factory()->create();
        
        $permit = Permit::create([
            'user_id' => $user->id,
            'company_id' => $user->company_id,
            'type' => 'sick',
            'start_date' => now()->toDateString(),
            'end_date' => now()->toDateString(),
            'reason' => 'Feeling unwell',
            'status' => 'pending'
        ]);

        $this->assertDatabaseHas('permits', [
            'id' => $permit->id,
            'reason' => 'Feeling unwell'
        ]);
    }
}
