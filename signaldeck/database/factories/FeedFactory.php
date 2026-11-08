<?php

namespace Database\Factories;

use App\Models\Feed;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Feed>
 */
class FeedFactory extends Factory
{
    protected $model = Feed::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->company() . ' ' . fake()->randomElement(['News', 'RSS', 'Feed', 'Wire']),
            'url' => fake()->url() . '/rss',
            'category' => fake()->randomElement(['politics', 'tech', 'finance', 'world']),
            'is_active' => true,
            'last_synced_at' => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }

    public function politics(): static
    {
        return $this->state(fn () => ['category' => 'politics']);
    }

    public function tech(): static
    {
        return $this->state(fn () => ['category' => 'tech']);
    }
}
