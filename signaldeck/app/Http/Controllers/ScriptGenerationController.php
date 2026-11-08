<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Story;
use App\Models\Segment;
use App\Services\OpenAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ScriptGenerationController extends Controller
{
    protected $openAIService;

    public function __construct(OpenAIService $openAIService)
    {
        $this->openAIService = $openAIService;
    }

    /**
     * Generate script segments from selected articles (returns JSON for inline preview).
     */
    public function generate(Request $request)
    {
        \Illuminate\Support\Facades\Log::info("ScriptGenerationController: generate called.");
        set_time_limit(300); // 5 minutes for AI generation
        ini_set('memory_limit', '512M'); // Increase memory for large JSON responses

        try {
            $request->validate([
                'article_ids' => 'required|array|min:1',
                'tone' => 'sometimes|string|in:Analyst,Hype',
                'selected_facts' => 'sometimes|array',
            ]);

            $tone = $request->input('tone', 'Analyst');
            $articleIds = $request->input('article_ids');
            $articles = Article::whereIn('id', $articleIds)->get();

            if ($articles->isEmpty()) {
                return response()->json(['error' => 'No valid articles found'], 422);
            }

            $selectedFacts = $request->input('selected_facts', []);
            $scriptData = $this->openAIService->generateScript($articles->toArray(), $tone, $selectedFacts);

            return response()->json([
                'segments' => $scriptData,
                'article_count' => $articles->count(),
                'tone' => $tone,
            ]);
        } catch (RuntimeException $e) {
            \Illuminate\Support\Facades\Log::error("ScriptGeneration error: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 503);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("ScriptGeneration error: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
            return response()->json(['error' => 'Script generation failed.'], 500);
        }
    }

    /**
     * Save a previewed script as a Story with Segments.
     */
    public function saveAsStory(Request $request)
    {
        $request->validate([
            'article_ids' => 'required|array|min:1',
            'tone' => 'sometimes|string|in:Analyst,Hype',
            'segments' => 'required|array|min:1',
            'segments.*.type' => 'required|string',
            'segments.*.text' => 'required|string',
        ]);

        $tone = $request->input('tone', 'Analyst');
        $articleIds = $request->input('article_ids');
        $articles = Article::whereIn('id', $articleIds)->get();
        $segmentsData = $request->input('segments');

        $title = "Story: " . $articles->first()->title . (count($articles) > 1 ? " and others" : "");

        $story = DB::transaction(function () use ($title, $tone, $articleIds, $segmentsData, $request, $articles) {
            $story = Story::create([
                'user_id' => $request->user()->id,
                'title' => $title,
                'status' => 'draft',
                'tone' => $tone,
            ]);

            $story->articles()->attach($articleIds);

            foreach ($segmentsData as $index => $segment) {
                // Map source_index to article URL
                $sourceUrl = null;
                if (isset($segment['source_index'])) {
                    $articleIndex = $segment['source_index'] - 1; // 1-based to 0-based
                    $articlesList = $articles->values();
                    if (isset($articlesList[$articleIndex])) {
                        $sourceUrl = $articlesList[$articleIndex]->url;
                    }
                }

                Segment::create([
                    'story_id' => $story->id,
                    'order' => $index,
                    'type' => $segment['type'] ?? 'body',
                    'script_text' => $segment['text'] ?? '',
                    'source_url' => $sourceUrl,
                ]);
            }

            return $story;
        });

        return response()->json([
            'story_id' => $story->id,
            'redirect' => route('stories.show', $story),
        ]);
    }

    /**
     * Regenerate a single segment using AI.
     */
    public function regenerateSegment(Request $request)
    {
        $request->validate([
            'segment_id' => 'required|integer|exists:segments,id',
            'story_id' => 'required|integer|exists:stories,id',
            'instruction' => 'sometimes|nullable|string|max:500',
        ]);

        $story = Story::with(['segments', 'articles'])->findOrFail($request->input('story_id'));
        $segment = Segment::findOrFail($request->input('segment_id'));

        // Verify segment belongs to story
        if ($segment->story_id !== $story->id) {
            return response()->json(['error' => 'Segment does not belong to this story'], 422);
        }

        try {
            $result = $this->openAIService->regenerateSegment(
                $segment->type,
                $segment->script_text,
                $story->segments->toArray(),
                $story->articles->toArray(),
                $story->tone ?? 'Analyst',
                $request->input('instruction')
            );
        } catch (RuntimeException $exception) {
            return response()->json(['error' => $exception->getMessage()], 503);
        }

        // Update the segment in the database
        $segment->update([
            'script_text' => $result['text'],
        ]);

        return response()->json([
            'segment_id' => $segment->id,
            'text' => $result['text'],
            'visual_cue' => $result['visual_cue'] ?? null,
        ]);
    }

    /**
     * Regenerate ALL segments for a story using AI.
     */
    public function regenerateAllSegments(Request $request)
    {
        $request->validate([
            'story_id' => 'required|integer|exists:stories,id',
        ]);

        $story = Story::with(['articles'])->findOrFail($request->input('story_id'));
        $tone = $story->tone ?? 'Analyst';

        // Generate entirely new script from articles
        try {
            $scriptData = $this->openAIService->generateScript($story->articles->toArray(), $tone);
        } catch (RuntimeException $exception) {
            return response()->json(['error' => $exception->getMessage()], 503);
        }

        // Replace all segments in a transaction
        $newSegments = DB::transaction(function () use ($story, $scriptData) {
            // Delete old segments
            $story->segments()->delete();

            // Create new segments
            $created = [];
            foreach ($scriptData as $index => $segData) {
                // Map source_index to article URL
                $sourceUrl = null;
                if (isset($segData['source_index'])) {
                    $articleIndex = $segData['source_index'] - 1;
                    $articlesList = $story->articles->values();
                    if (isset($articlesList[$articleIndex])) {
                        $sourceUrl = $articlesList[$articleIndex]->url;
                    }
                }

                $created[] = [
                    'model' => Segment::create([
                        'story_id' => $story->id,
                        'order' => $index,
                        'type' => $segData['type'] ?? 'body',
                        'script_text' => $segData['text'] ?? '',
                        'source_url' => $sourceUrl,
                    ]),
                    'visual_cue' => $segData['visual_cue'] ?? null,
                ];
            }

            return $created;
        });

        return response()->json([
            'segments' => collect($newSegments)->map(fn($item) => [
                'id' => $item['model']->id,
                'type' => $item['model']->type,
                'script_text' => $item['model']->script_text,
                'visual_cue' => $item['visual_cue'],
            ]),
        ]);
    }
}
