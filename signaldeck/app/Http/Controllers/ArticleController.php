<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Feed;
use App\Services\SignalScoreService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ArticleController extends Controller
{
    protected $signalScoreService;

    public function __construct(SignalScoreService $signalScoreService)
    {
        $this->signalScoreService = $signalScoreService;
    }

    public function index(Request $request)
    {
        $query = Article::with('feed')->latest('published_at');

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        if ($request->has('feed_id') && $request->input('feed_id') !== 'all') {
            $query->where('feed_id', $request->input('feed_id'));
        }

        $articles = $query->paginate(25)->withQueryString();

        // Compute signal scores for each article
        $mode = $request->input('score_mode', 'analyst');
        $articles->getCollection()->transform(function ($article) use ($mode) {
            $breakdown = $this->signalScoreService->calculate($article, $mode);
            $article->signal_score = $breakdown->total;
            $article->signal_breakdown = $breakdown;
            return $article;
        });

        $feeds = Feed::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('articles/index', [
            'articles' => $articles,
            'feeds' => $feeds,
            'filters' => $request->only(['search', 'feed_id']),
            'currentMode' => $mode,
        ]);
    }
}
