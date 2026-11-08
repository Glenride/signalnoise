<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScriptGenerationControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_generate_returns_service_unavailable_when_openai_is_not_configured(): void
    {
        config()->set('services.openai.key', null);

        $user = User::factory()->create();
        $article = Article::factory()->create();

        $response = $this->actingAs($user)
            ->postJson(route('scripts.generate'), [
                'article_ids' => [$article->id],
                'tone' => 'Analyst',
            ]);

        $response
            ->assertStatus(503)
            ->assertJson([
                'error' => 'OpenAI is not configured. Set OPENAI_API_KEY to generate scripts.',
            ]);
    }
}
