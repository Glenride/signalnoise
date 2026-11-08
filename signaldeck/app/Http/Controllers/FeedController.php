<?php

namespace App\Http\Controllers;

use App\Http\Requests\FeedRequest;
use App\Jobs\SyncFeedJob;
use App\Models\Feed;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeedController extends Controller
{
    public function index(Request $request): Response
    {
        $feeds = $request->user()
            ->feeds()
            ->withCount('articles')
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        return Inertia::render('feeds/index', [
            'feeds' => $feeds,
            'categories' => ['politics', 'tech', 'finance', 'world'],
        ]);
    }

    public function store(FeedRequest $request): RedirectResponse
    {
        $request->user()->feeds()->create($request->validated());

        return redirect()->route('feeds.index')
            ->with('success', 'Feed added successfully.');
    }

    public function update(FeedRequest $request, Feed $feed): RedirectResponse
    {
        $this->authorize('update', $feed);

        $feed->update($request->validated());

        return redirect()->route('feeds.index')
            ->with('success', 'Feed updated successfully.');
    }

    public function destroy(Request $request, Feed $feed): RedirectResponse
    {
        $this->authorize('delete', $feed);

        $feed->delete();

        return redirect()->route('feeds.index')
            ->with('success', 'Feed deleted successfully.');
    }

    public function toggleActive(Request $request, Feed $feed): RedirectResponse
    {
        $this->authorize('update', $feed);

        $feed->update(['is_active' => !$feed->is_active]);

        return redirect()->route('feeds.index');
    }

    public function sync(Request $request, Feed $feed): RedirectResponse
    {
        $this->authorize('update', $feed);

        SyncFeedJob::dispatchSync($feed);

        return redirect()->route('feeds.index')
            ->with('success', "Syncing \"{$feed->name}\" — articles will appear shortly.");
    }

    public function syncAll(Request $request): RedirectResponse
    {
        $feeds = $request->user()->feeds()->active()->get();

        foreach ($feeds as $feed) {
            SyncFeedJob::dispatchSync($feed);
        }

        return redirect()->back()
            ->with('success', "Syncing all active feeds — articles will appear shortly.");
    }
}
