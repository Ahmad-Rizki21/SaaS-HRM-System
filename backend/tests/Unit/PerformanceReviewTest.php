<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\PerformanceReview;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PerformanceReviewTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_publish_a_kpi_review()
    {
        $user = User::factory()->create();
        $reviewer = User::factory()->create();
        
        $review = PerformanceReview::create([
            'user_id' => $user->id,
            'reviewer_id' => $reviewer->id,
            'company_id' => $user->company_id,
            'period' => '2026-04',
            'score_total' => 85.5,
            'status' => 'published'
        ]);

        $this->assertEquals('published', $review->status);
        $this->assertEquals(85.5, $review->score_total);
    }
}
