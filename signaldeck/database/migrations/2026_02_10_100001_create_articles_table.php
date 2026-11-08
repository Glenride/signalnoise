<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('feed_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('url', 2048);
            $table->string('author')->nullable();
            $table->text('summary')->nullable();
            $table->longText('content')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->string('group_hash')->index();
            $table->integer('signal_score')->nullable();
            $table->json('signal_flags')->nullable();
            $table->timestamps();

            $table->unique(['feed_id', 'url']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
