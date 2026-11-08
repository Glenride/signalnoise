<?php

namespace App\Jobs;

use App\Models\Article;
use App\Models\Feed;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use SimplePie\SimplePie;

class SyncFeedJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;

    public function __construct(
        public Feed $feed
    ) {}

    public function handle(): void
    {
        $simplepie = new SimplePie();
        $simplepie->set_feed_url($this->feed->url);
        $simplepie->set_cache_location(storage_path('framework/cache'));
        $simplepie->enable_cache(false);
        $simplepie->init();

        if ($simplepie->error()) {
            Log::warning("SyncFeedJob: Failed to parse feed [{$this->feed->name}]: {$simplepie->error()}");
            return;
        }

        $items = $simplepie->get_items();
        $synced = 0;

        foreach ($items as $item) {
            $title = $item->get_title() ?? '';
            $url = $item->get_permalink() ?? '';

            if (empty($url)) {
                continue;
            }

            $groupHash = hash('sha256', $this->normalizeTitle($title));

            $article = Article::updateOrCreate(
                [
                    'feed_id' => $this->feed->id,
                    'url' => $url,
                ],
                [
                    'title' => $title,
                    'author' => $item->get_author()?->get_name(),
                    'summary' => strip_tags($item->get_description() ?? ''),
                    'content' => $item->get_content(),
                    'published_at' => $item->get_date('Y-m-d H:i:s'),
                    'group_hash' => $groupHash,
                ]
            );

            if ($article->wasRecentlyCreated) {
                \App\Jobs\AnalyzeArticleJob::dispatch($article);
            }

            $synced++;
        }

        $this->feed->update(['last_synced_at' => now()]);

        Log::info("SyncFeedJob: Synced {$synced} articles from [{$this->feed->name}]");
    }

    /**
     * Normalize a title for deduplication grouping.
     * Strips punctuation, lowercases, and removes common filler words.
     */
    private function normalizeTitle(string $title): string
    {
        $title = strtolower($title);
        $title = preg_replace('/[^a-z0-9\s]/', '', $title);
        $title = preg_replace('/\s+/', ' ', trim($title));

        // Remove common stop words for better grouping
        $stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but'];
        $words = explode(' ', $title);
        $words = array_diff($words, $stopWords);

        return implode(' ', $words);
    }
}
