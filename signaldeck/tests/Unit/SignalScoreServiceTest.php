<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\SignalScoreService;
use App\Models\Article;
use App\Models\Feed;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SignalScoreServiceTest extends TestCase
{
    use RefreshDatabase;

    protected SignalScoreService $service;

    protected function setUp(): void
    {
        parent::setUp();
        // Create a user because Factory might need it
        User::factory()->create();
        $this->service = new SignalScoreService();
    }

    public function test_freshness_score_decays_with_time()
    {
        $feed = Feed::factory()->create();

        // 1. New article (0 hours old) -> High Score
        $newArticle = Article::factory()->create([
            'feed_id' => $feed->id,
            'published_at' => Carbon::now()
        ]);
        $score = $this->service->calculate($newArticle);
        $this->assertGreaterThan(90, $score->freshness);

        // 2. 12 hours old -> Moderate Score
        $midArticle = Article::factory()->create([
            'feed_id' => $feed->id,
            'published_at' => Carbon::now()->subHours(11)
        ]);
        $score = $this->service->calculate($midArticle);
        $this->assertLessThan(95, $score->freshness);
        $this->assertGreaterThan(30, $score->freshness);

        // 3. 3 days old -> Low Score
        $oldArticle = Article::factory()->create([
            'feed_id' => $feed->id,
            'published_at' => Carbon::now()->subDays(3)
        ]);
        $score = $this->service->calculate($oldArticle);
        $this->assertLessThan(40, $score->freshness);
    }

    public function test_velocity_score_increases_with_cluster_size()
    {
        $feed = Feed::factory()->create();
        $hash = 'test-hash-123';
        
        // Create 1 article (Cluster size 1)
        $article = Article::factory()->create(['feed_id' => $feed->id, 'group_hash' => $hash]);
        $score = $this->service->calculate($article);
        // Size 1 -> 0 velocity (normalized log(1) is 0)
        $this->assertEquals(0, $score->velocity);

        // Create 4 more (Cluster size 5)
        Article::factory()->count(4)->create(['feed_id' => $feed->id, 'group_hash' => $hash]);
        
        $score = $this->service->calculate($article);
        // Size 5 -> Some velocity
        $this->assertGreaterThan(10, $score->velocity);
    }

    public function test_credibility_score_uses_domain_tiers()
    {
        // Tier A (e.g. reuters.com -> 95)
        $feedA = Feed::factory()->create(['url' => 'https://www.reuters.com/rss']);
        $articleA = Article::factory()->create(['feed_id' => $feedA->id, 'url' => 'https://reuters.com/news/123']);
        $scoreA = $this->service->calculate($articleA);
        $this->assertEquals(95, $scoreA->credibility);

        // Unknown Domain (-> 50)
        $feedUnknown = Feed::factory()->create(['url' => 'https://some-random-blog.com/rss']);
        $articleUnknown = Article::factory()->create(['feed_id' => $feedUnknown->id, 'url' => 'https://some-random-blog.com/post/1']);
        $scoreUnknown = $this->service->calculate($articleUnknown);
        $this->assertEquals(50, $scoreUnknown->credibility); 
    }

    public function test_impact_score_detects_keywords()
    {
        $feed = Feed::factory()->create();
        $article = Article::factory()->create([
            'feed_id' => $feed->id,
            'title' => 'Breaking: Massive Data Breach Exposes Millions',
            'summary' => 'Critical vulnerability found in core banking systems.',
            'content' => 'This is a catastrophic event.',
        ]);

        $score = $this->service->calculate($article);
        $this->assertGreaterThan(40, $score->impact);
        // Check reasons
        // $this->assertContains('Found: Breach', $score->reasons); // Or similar
    }
    
    public function test_creator_modes_affect_total_score()
    {
        $hash = 'viral-trash';
        $feed = Feed::factory()->create(['url' => 'https://tabloid.com']); // Tier D or unknown (low/mid)
        
        // Create a cluster of 10 articles (High Velocity)
        Article::factory()->count(10)->create(['feed_id' => $feed->id, 'group_hash' => $hash]);
        
        $article = Article::where('group_hash', $hash)->first();

        // Check Hype Mode (High velocity weight)
        $hypeScore = $this->service->calculate($article, 'hype');
        
        // Check Analyst Mode (Lower velocity weight, higher credibility)
        $analystScore = $this->service->calculate($article, 'analyst');

        // Verify total scores are different due to weighting
        $this->assertNotEquals($hypeScore->total, $analystScore->total);
    }
}
