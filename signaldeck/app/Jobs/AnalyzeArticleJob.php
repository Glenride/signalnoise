<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class AnalyzeArticleJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public \App\Models\Article $article
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $apiKey = config('services.openai.key', env('OPENAI_API_KEY'));
        $model = config('services.openai.model', env('OPENAI_MODEL', 'gpt-4o-mini'));

        if (empty($apiKey)) {
             \Illuminate\Support\Facades\Log::warning("AnalyzeArticleJob: No OpenAI Key");
             return;
        }

        $prompt = <<<EOT
Analyze this news article and provide a JSON response with three keys:
1. "insight": A single, punchy sentence explaining why this story matters to a trader or analyst.
2. "sentiment": One of "Positive", "Negative", "Neutral", or "Crisis".
3. "facts": An array of 3-5 listing specific, verifiable facts from the article (e.g. "Company X revenue up 20%", "CEO resigned effective immediately").

Title: {$this->article->title}
Content: {$this->article->summary} ... (truncated)
EOT;

        try {
            $response = \Illuminate\Support\Facades\Http::withToken($apiKey)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are a financial news analyst. Output valid JSON only.'],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => 0.4,
                ]);

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content');
                $content = str_replace(['```json', '```'], '', $content);
                $data = json_decode($content, true);

                if ($data) {
                    $this->article->update([
                        'ai_insight' => $data['insight'] ?? null,
                        'ai_sentiment' => $data['sentiment'] ?? 'Neutral',
                        'ai_facts' => $data['facts'] ?? [],
                    ]);
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("AnalyzeArticleJob Error: " . $e->getMessage());
        }
    }
}
