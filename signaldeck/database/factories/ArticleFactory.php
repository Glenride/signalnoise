<?php

namespace Database\Factories;

use App\Models\Feed;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Article>
 */
class ArticleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'feed_id' => Feed::factory(),
            'title' => $this->faker->sentence(),
            'url' => $this->faker->url(),
            'author' => $this->faker->name(),
            'summary' => $this->faker->paragraph(),
            'content' => $this->faker->paragraphs(3, true),
            'published_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'group_hash' => md5($this->faker->sentence()),
            'signal_score' => $this->faker->numberBetween(0, 100),
            'signal_flags' => [],
        ];
    }
}
