<?php

use App\Http\Controllers\FeedController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    Route::get('war-room', [\App\Http\Controllers\DashboardController::class, 'warRoom'])->name('war-room');

    Route::resource('feeds', FeedController::class)->except(['show', 'create', 'edit']);
    Route::post('feeds/{feed}/toggle', [FeedController::class, 'toggleActive'])->name('feeds.toggle');
    Route::post('feeds/{feed}/sync', [FeedController::class, 'sync'])->name('feeds.sync');
    Route::post('feeds/sync-all', [FeedController::class, 'syncAll'])->name('feeds.syncAll');

    Route::resource('stories', \App\Http\Controllers\StoryController::class)->only(['index', 'store', 'show', 'update']);
    Route::get('stories/{story}/studio', [\App\Http\Controllers\StoryController::class, 'studio'])->name('stories.studio');
    Route::get('stories/{story}/studio/present', [\App\Http\Controllers\StoryController::class, 'studioPresentation'])->name('stories.studio.present');
    Route::get('articles', [\App\Http\Controllers\ArticleController::class, 'index'])->name('articles.index');

    Route::post('scripts/generate', [\App\Http\Controllers\ScriptGenerationController::class, 'generate'])->name('scripts.generate');
    Route::post('scripts/save', [\App\Http\Controllers\ScriptGenerationController::class, 'saveAsStory'])->name('scripts.save');
    Route::post('scripts/regenerate-segment', [\App\Http\Controllers\ScriptGenerationController::class, 'regenerateSegment'])->name('scripts.regenerateSegment');
    Route::post('scripts/regenerate-all', [\App\Http\Controllers\ScriptGenerationController::class, 'regenerateAllSegments'])->name('scripts.regenerateAll');

    Route::post('segments/generate-image', [\App\Http\Controllers\SegmentImageController::class, 'generate'])->name('segments.generateImage');
    Route::post('segments/upload-image', [\App\Http\Controllers\SegmentImageController::class, 'upload'])->name('segments.uploadImage');
    Route::post('segments/set-image-url', [\App\Http\Controllers\SegmentImageController::class, 'setUrl'])->name('segments.setImageUrl');
    Route::post('segments/remove-image', [\App\Http\Controllers\SegmentImageController::class, 'remove'])->name('segments.removeImage');

    Route::get('proxy/article', [\App\Http\Controllers\ArticleProxyController::class, 'show'])->name('proxy.article');
});

require __DIR__.'/settings.php';
