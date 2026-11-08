<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Story;
use App\Models\Segment;
use App\Services\OpenAIService;
use Illuminate\Http\Request;
use RuntimeException;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StoryController extends Controller
{
    protected $openAIService;

    public function __construct(OpenAIService $openAIService)
    {
        $this->openAIService = $openAIService;
    }

    public function index(Request $request)
    {
        $stories = Story::where('user_id', $request->user()->id)
            ->withCount(['articles', 'segments'])
            ->latest()
            ->paginate(20);

        return Inertia::render('stories/index', [
            'stories' => $stories,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'article_ids' => 'required|array|min:1',
            'tone' => 'sometimes|string|in:Analyst,Hype',
        ]);

        $tone = $request->input('tone', 'Analyst');
        $articleIds = $request->input('article_ids');
        $articles = Article::whereIn('id', $articleIds)->get();

        if ($articles->isEmpty()) {
            return back()->withErrors(['message' => 'No articles selected']);
        }

        // Create Story
        $title = "Story: " . $articles->first()->title . (count($articles) > 1 ? " and others" : "");
        
        // Use a transaction to ensure integrity
        try {
            $story = DB::transaction(function () use ($title, $tone, $articles, $articleIds, $request) {
                $story = Story::create([
                    'user_id' => $request->user()->id,
                    'title' => $title,
                    'status' => 'draft',
                    'tone' => $tone,
                ]);

                $story->articles()->attach($articleIds);

                $scriptData = $this->openAIService->generateScript($articles->toArray(), $tone);

                foreach ($scriptData as $index => $segment) {
                    $sourceUrl = null;
                    if (isset($segment['source_index'])) {
                        $articleIndex = $segment['source_index'] - 1;
                        if (isset($articles[$articleIndex])) {
                            $sourceUrl = $articles[$articleIndex]->url;
                        }
                    }

                    Segment::create([
                        'story_id' => $story->id,
                        'order' => $index,
                        'type' => $segment['type'] ?? 'body',
                        'script_text' => $segment['text'] ?? '',
                        'visual_cue' => $segment['visual_cue'] ?? null,
                        'source_url' => $sourceUrl,
                    ]);
                }

                return $story;
            });
        } catch (RuntimeException $exception) {
            return back()->withErrors(['message' => $exception->getMessage()]);
        }

        return to_route('stories.show', $story);
    }

    public function show(Story $story)
    {
        $story->load(['segments', 'articles']);
        return Inertia::render('story/editor', [
            'story' => $story
        ]);
    }

    public function studio(Story $story)
    {
        $story->load(['segments', 'articles']);
        return Inertia::render('story/studio', [
            'story' => $story
        ]);
    }

    public function studioPresentation(Story $story)
    {
        $story->load(['segments', 'articles']);
        return Inertia::render('story/studio-presentation', [
            'story' => $story
        ]);
    }

    public function update(Request $request, Story $story)
    {
        $request->validate([
            'status' => 'sometimes|string|in:draft,final,scripted,recorded',
            'segments' => 'sometimes|array',
            'segments.*.id' => 'required_with:segments|integer|exists:segments,id',
            'segments.*.script_text' => 'required_with:segments|string',
        ]);

        if ($request->has('status')) {
            $story->update(['status' => $request->input('status')]);
        }

        if ($request->has('segments')) {
            foreach ($request->input('segments') as $segData) {
                $updateData = ['script_text' => $segData['script_text']];
                if (isset($segData['visual_cue'])) {
                    $updateData['visual_cue'] = $segData['visual_cue'];
                }
                Segment::where('id', $segData['id'])
                    ->where('story_id', $story->id)
                    ->update($updateData);
            }
        }

        return response()->json(['success' => true]);
    }
}
