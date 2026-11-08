<?php

namespace App\Console\Commands;

use App\Jobs\SyncFeedJob;
use App\Models\Feed;
use Illuminate\Console\Command;

class SyncFeedsCommand extends Command
{
    protected $signature = 'feeds:sync {--feed= : Sync a specific feed by ID}';
    protected $description = 'Sync all active RSS feeds (or a specific feed by ID)';

    public function handle(): int
    {
        $feedId = $this->option('feed');

        if ($feedId) {
            $feed = Feed::find($feedId);
            if (!$feed) {
                $this->error("Feed #{$feedId} not found.");
                return self::FAILURE;
            }
            SyncFeedJob::dispatch($feed);
            $this->info("Dispatched sync for feed: {$feed->name}");
            return self::SUCCESS;
        }

        $feeds = Feed::active()->get();

        if ($feeds->isEmpty()) {
            $this->warn('No active feeds to sync.');
            return self::SUCCESS;
        }

        $feeds->each(fn (Feed $feed) => SyncFeedJob::dispatch($feed));

        $this->info("Dispatched sync for {$feeds->count()} active feed(s).");

        return self::SUCCESS;
    }
}
