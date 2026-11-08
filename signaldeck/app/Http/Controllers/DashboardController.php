<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Feed;
use App\Services\SignalScoreService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    protected $signalScoreService;

    public function __construct(SignalScoreService $signalScoreService)
    {
        $this->signalScoreService = $signalScoreService;
    }

    public function index()
    {
        // Fetch feeds (for sidebar)
        // Fetch feeds (for sidebar)
        $feeds = request()->user()->feeds()->get();

        // Fetch recent articles
        $query = Article::with('feed')->latest('published_at');

        if (request()->has('feed_id')) {
            $query->where('feed_id', request()->get('feed_id'));
        }

        $articles = $query->take(100)->get();

        // Calculate scores and attach to articles
        $mode = request('score_mode', 'analyst');
        $articles->transform(function ($article) use ($mode) {
            $breakdown = $this->signalScoreService->calculate($article, $mode);
            $article->signal_score = $breakdown->total;
            $article->signal_breakdown = $breakdown;
            return $article;
        });

        // Sort by signal score descending
        $articles = $articles->sortByDesc('signal_score')->values();

        // Grouping Logic (Basic implementation: cluster by Feed Category for now, or just return flat list with metadata)
        // For Phase 2, we'll send a flat list and let the frontend handle basic visual grouping or just sort by score.
        // We can also implement a basic clustering here if needed, but let's start simple.

        return Inertia::render('dashboard', [
            'feeds' => $feeds,
            'articles' => $articles,
            'currentFeedId' => request()->get('feed_id'),
            'currentMode' => $mode,
        ]);
    }

    public function warRoom()
    {
        $feeds = request()->user()->feeds()->get();

        $query = Article::with('feed')->latest('published_at');

        if (request()->has('feed_id')) {
            $query->where('feed_id', request()->get('feed_id'));
        }

        $articles = $query->take(100)->get();

        $mode = request('score_mode', 'analyst');
        $articles->transform(function ($article) use ($mode) {
            $breakdown = $this->signalScoreService->calculate($article, $mode);
            $article->signal_score = $breakdown->total;
            $article->signal_breakdown = $breakdown;
            return $article;
        });

        return Inertia::render('war-room', [
            'feeds' => $feeds,
            'articles' => $articles,
            'currentFeedId' => request()->get('feed_id'),
            'currentMode' => $mode,
        ]);
    }
}
