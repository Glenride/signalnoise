<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Feed;
use App\Models\Article;
use App\Models\User;

class DashboardSeeder extends Seeder
{
    public function run(): void
    {
        // Create a user if not exists
        if (!User::where('email', 'test@example.com')->exists()) {
             User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => bcrypt('password'),
            ]);
        }

        // Create Feeds
        $feeds = [
            ['name' => 'Tech Crunch', 'url' => 'https://techcrunch.com/feed/', 'category' => 'Technology'],
            ['name' => 'The Verge', 'url' => 'https://www.theverge.com/rss/index.xml', 'category' => 'Technology'],
            ['name' => 'Wired', 'url' => 'https://www.wired.com/feed/rss', 'category' => 'Technology'],
        ];

        $user = User::where('email', 'test@example.com')->first();

        foreach ($feeds as $feedData) {
            $feedData['user_id'] = $user->id;
            $feed = Feed::firstOrCreate(['url' => $feedData['url']], $feedData);

            // Create Articles for each feed
            for ($i = 0; $i < 5; $i++) {
                Article::firstOrCreate(
                    [
                        'feed_id' => $feed->id,
                        'url' => fake()->unique()->url(),
                    ],
                    [
                        'title' => 'Breaking: ' . fake()->sentence(),
                        'content' => fake()->paragraph(),
                        'created_at' => now()->subMinutes(rand(1, 100)),
                        'group_hash' => md5(fake()->sentence()),
                        'signal_score' => rand(0, 100),
                    ]
                );
            }
            
            // Create some "Viral" articles
            Article::firstOrCreate(
                [
                    'feed_id' => $feed->id,
                    'url' => fake()->unique()->url(),
                ],
                [
                    'title' => 'VIRAL VIDEO: ' . fake()->sentence(),
                    'content' => fake()->paragraph(),
                    'created_at' => now()->subMinutes(rand(1, 10)),
                    'group_hash' => md5(fake()->sentence()),
                    'signal_score' => rand(80, 100),
                ]
            );
        }
    }
}
