<?php

namespace App\Services;

use RuntimeException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAIService
{
    protected ?string $apiKey;
    protected string $model;

    public function __construct()
    {
        $this->apiKey = config('services.openai.key', env('OPENAI_API_KEY'));
        $this->model = config('services.openai.model', env('OPENAI_MODEL', 'gpt-4o-mini'));
    }

    /**
     * Generate a script from a list of articles.
     *
     * @param array $articles List of article contents/titles.
     * @param string $tone 'Analyst' or 'Hype'
     * @return array Structured segments
     */
    public function generateScript(array $articles, string $tone = 'Analyst', array $selectedFacts = []): array
    {
        if (empty($this->apiKey)) {
            Log::warning('OpenAI API Key missing for script generation.');
            throw new RuntimeException('OpenAI is not configured. Set OPENAI_API_KEY to generate scripts.');
        }

        $prompt = $this->buildPrompt($articles, $tone, $selectedFacts);

        try {
            Log::info("Starting OpenAI script generation with model: {$this->model}");
            $startTime = microtime(true);

            $response = Http::withToken($this->apiKey)
                ->timeout(240) // Increased timeout for longer scripts
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $this->model,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are a professional news script writer. Output ONLY valid JSON array of segments.',
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt,
                        ],
                    ],
                    // 'temperature' => 0.7, // Removed to support o1 models and default behavior
                ]);

            $duration = microtime(true) - $startTime;
            Log::info("OpenAI response received in {$duration} seconds. Status: " . $response->status());

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content');
                return $this->parseGeneratedScriptResponse($content);
            } else {
                Log::error('OpenAI API Error: ' . $response->body());
                throw new RuntimeException('OpenAI script generation failed.');
            }
        } catch (\Throwable $e) {
            Log::error('OpenAI Exception: ' . $e->getMessage());
            throw new RuntimeException('OpenAI script generation failed.', previous: $e);
        }
    }

    protected function buildPrompt(array $articles, string $tone, array $selectedFacts = []): string
    {
        $articlesText = "";
        foreach ($articles as $index => $article) {
            $tabNum = $index + 1;
            $insight = $article['ai_insight'] ?? '';
            $sentiment = $article['ai_sentiment'] ?? '';
            $context = $insight ? "\n[AI Insight: $insight ($sentiment)]" : "";

            // Check if specific facts were selected for this article
            $factsForArticle = $selectedFacts[$article['id']] ?? [];
            if (!empty($factsForArticle)) {
                $factsList = implode("\n- ", $factsForArticle);
                $context .= "\n[USER SELECTED KEY FACTS - FOCUS ON THESE]:\n- $factsList";
            }

            $articlesText .= "[TAB {$tabNum}] Article {$tabNum}: " . $article['title'] . $context . "\n" . substr($article['content'] ?? '', 0, 500) . "...\n\n";
        }

        $styleGuide = match($tone) {
            'Hype' => "Style: High energy, sensational, urgent. Use words like 'BREAKING', 'SHOCKING', 'MUST SEE'. Focus on viral potential.",
            default => "Style: Professional, analytical, objective. Focus on facts, market impact, and geopolitical context. Like a senior analyst briefing.",
        };

        return <<<EOT
You are writing a news script based on the following articles:

$articlesText

$styleGuide

IMPORTANT: When referencing information from a specific article, insert the marker [TAB N] (e.g. [TAB 1], [TAB 2]) inline in the script text at the point where the presenter should switch to showing that source. This tells the production system which browser tab to display.

Format the output as a JSON array of segments. Each segment should have:
- 'type': 'hook', 'intro', 'body', 'transition', or 'outro'
- 'text': The script text to be read, with [TAB N] markers inline where source switches should happen.
- 'visual_cue': Suggestion for B-roll or graphics (optional).
- 'source_index': The 1-based index of the primary article being referenced in this segment (required for body segments).

Each BODY segment must be SUBSTANTIVE and detailed, at least 500-700 words long, providing deep analysis and context. Transitions can be shorter.

Example format:
[
    { "type": "hook", "text": "Breaking news tonight...", "visual_cue": "News desk graphic" },
    { "type": "body", "text": "[TAB 1] According to this report, the scandal runs deep...", "source_index": 1, "visual_cue": "Show article headline" },
    { "type": "body", "text": "[TAB 2] And if we look at the data here...", "source_index": 2 },
    { "type": "outro", "text": "That's the signal for today...", "visual_cue": "Outro card" }
]
EOT;
    }

    /**
     * Regenerate a single segment of a script.
     *
     * @param string $segmentType The type of the segment (hook, intro, body, etc.)
     * @param string $currentText The current text of the segment
     * @param array $allSegments All segments for context
     * @param array $articles Source articles
     * @param string $tone Tone style
     * @param string|null $instruction Optional user instruction for the rewrite
     * @return array { text: string, visual_cue?: string }
     */
    public function regenerateSegment(
        string $segmentType,
        string $currentText,
        array $allSegments,
        array $articles,
        string $tone = 'Analyst',
        ?string $instruction = null
    ): array {
        if (empty($this->apiKey)) {
            Log::warning('OpenAI API Key missing for segment regeneration.');
            throw new RuntimeException('OpenAI is not configured. Set OPENAI_API_KEY to regenerate segments.');
        }

        $prompt = $this->buildSegmentRegeneratePrompt(
            $segmentType, $currentText, $allSegments, $articles, $tone, $instruction
        );

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(45)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $this->model,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are a professional news script writer. Output ONLY valid JSON with keys "text" and optionally "visual_cue".',
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt,
                        ],
                    ],
                    'temperature' => 0.8,
                ]);

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content');
                $content = str_replace(['```json', '```'], '', $content);
                $parsed = json_decode(trim($content), true);
                if ($parsed && isset($parsed['text'])) {
                    return $parsed;
                }
                return ['text' => trim($content)];
            } else {
                Log::error('OpenAI Segment Regen Error: ' . $response->body());
                throw new RuntimeException('OpenAI segment regeneration failed.');
            }
        } catch (\Exception $e) {
            Log::error('OpenAI Segment Regen Exception: ' . $e->getMessage());
            throw new RuntimeException('OpenAI segment regeneration failed.', previous: $e);
        }
    }

    protected function buildSegmentRegeneratePrompt(
        string $segmentType,
        string $currentText,
        array $allSegments,
        array $articles,
        string $tone,
        ?string $instruction
    ): string {
        $articlesText = "";
        foreach ($articles as $index => $article) {
            $articlesText .= "Article " . ($index + 1) . ": " . ($article['title'] ?? 'Untitled') . "\n" . substr($article['content'] ?? '', 0, 300) . "...\n\n";
        }

        $contextText = "";
        foreach ($allSegments as $seg) {
            $marker = ($seg['type'] === $segmentType && $seg['script_text'] === $currentText) ? ' ← REWRITE THIS' : '';
            $contextText .= "[" . strtoupper($seg['type'] ?? 'body') . "]{$marker}\n" . ($seg['script_text'] ?? '') . "\n\n";
        }

        $styleGuide = match($tone) {
            'Hype' => "Style: High energy, sensational, urgent. Focus on viral potential.",
            default => "Style: Professional, analytical, objective. Like a senior analyst briefing.",
        };

        $instructionLine = $instruction
            ? "The user has provided this specific instruction: \"{$instruction}\"\n\n"
            : "";

        $lengthInstruction = ($segmentType === 'body')
            ? "Ensure this segment is SUBSTANTIVE and detailed, at least 500-700 words long."
            : "Keep it roughly the same length.";

        return <<<EOT
You are rewriting ONE segment of a news script.

Source articles:
$articlesText

Full script for context:
$contextText

$styleGuide

$instructionLine
Rewrite ONLY the segment marked "← REWRITE THIS" (type: {$segmentType}).
$lengthInstruction
Make it fresh and different from the current version.

Return a JSON object with:
- "text": the new script text
- "visual_cue": a suggestion for B-roll or graphics (optional)

Example: { "text": "New script text here...", "visual_cue": "Show chart of market trends" }
EOT;
    }

    protected function parseGeneratedScriptResponse(?string $content): array
    {
        if (empty($content)) {
            Log::error('OpenAI returned empty content for script generation.');
            throw new RuntimeException('OpenAI returned empty content for script generation.');
        }

        // Strip markdown code fences if present
        $content = str_replace(['```json', '```'], '', $content);
        $parsed = json_decode(trim($content), true);

        if (!is_array($parsed) || empty($parsed)) {
            Log::error('Failed to parse OpenAI script response as JSON array. Raw content: ' . substr($content, 0, 500));
            throw new RuntimeException('OpenAI returned invalid JSON for script generation.');
        }

        // Validate each segment has at least a 'type' and 'text'
        $valid = array_filter($parsed, fn($seg) => isset($seg['type']) && isset($seg['text']));

        if (empty($valid)) {
            Log::error('Parsed script segments had no valid entries with type+text.');
            throw new RuntimeException('OpenAI returned no valid script segments.');
        }

        return array_values($valid);
    }
    public function generateImage(string $prompt): string
    {
        if (empty($this->apiKey)) {
            Log::warning('OpenAI API Key missing for image generation.');
            throw new RuntimeException('OpenAI is not configured. Set OPENAI_API_KEY to generate images.');
        }

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(60)
                ->post('https://api.openai.com/v1/images/generations', [
                    'model' => 'dall-e-3',
                    'prompt' => "A professional, photorealistic news broadcast background image representing: " . $prompt . ". High quality, 4k, suitable for a news studio screen.",
                    'n' => 1,
                    'size' => "1024x1024",
                ]);

            if ($response->successful()) {
                $imageUrl = $response->json('data.0.url');

                if (!is_string($imageUrl) || $imageUrl === '') {
                    Log::error('OpenAI Image Gen Error: missing image URL in response.');
                    throw new RuntimeException('OpenAI image generation failed.');
                }

                return $imageUrl;
            } else {
                Log::error('OpenAI Image Gen Error: ' . $response->body());
                throw new RuntimeException('OpenAI image generation failed.');
            }
        } catch (\Exception $e) {
            Log::error('OpenAI Image Gen Exception: ' . $e->getMessage());
            throw new RuntimeException('OpenAI image generation failed.', previous: $e);
        }
    }
}
