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
    public function test_it_can_create_a_permit_request()
    {
        $company = \App\Models\Company::create(['name' => 'Test Co']);
        $user = User::factory()->create(['company_id' => $company->id]);
        
        $permit = Permit::create([
            'user_id' => $user->id,
            'company_id' => $company->id,
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
