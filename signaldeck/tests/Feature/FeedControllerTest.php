<?php

namespace Tests\Feature;

use App\Models\Feed;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class FeedControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_sync_own_feed()
    {
        Queue::fake();
        
        $user = User::factory()->create();
        $feed = Feed::create([
            'user_id' => $user->id,
            'name' => 'My Feed',
            'url' => 'http://example.com/feed.xml',
            'category' => 'tech',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)
            ->post(route('feeds.sync', $feed));

        $response->assertRedirect(route('feeds.index'));
        Queue::assertPushed(\App\Jobs\SyncFeedJob::class);
    }

    public function test_user_cannot_sync_others_feed()
    {
        Queue::fake();

        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $feed = Feed::create([
            'user_id' => $otherUser->id,
            'name' => 'Other Feed',
            'url' => 'http://example.com/feed.xml',
            'category' => 'tech',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)
            ->post(route('feeds.sync', $feed));

        $response->assertForbidden();
        Queue::assertNotPushed(\App\Jobs\SyncFeedJob::class);
    }

    public function test_user_can_sync_all_feeds()
    {
        Queue::fake();

        $user = User::factory()->create();
        
        Feed::create([
            'user_id' => $user->id,
            'name' => 'Feed 1',
            'url' => 'http://example.com/feed1.xml',
            'category' => 'tech',
            'is_active' => true,
        ]);

        Feed::create([
            'user_id' => $user->id,
            'name' => 'Feed 2',
            'url' => 'http://example.com/feed2.xml',
            'category' => 'news',
            'is_active' => true,
        ]);

        // Inactive feed (should not be synced)
        Feed::create([
            'user_id' => $user->id,
            'name' => 'Feed 3',
            'url' => 'http://example.com/feed3.xml',
            'category' => 'news',
            'is_active' => false,
        ]);

        $response = $this->actingAs($user)
            ->post(route('feeds.syncAll'));

        $response->assertRedirect();
        Queue::assertPushed(\App\Jobs\SyncFeedJob::class, 2);
    }
}
