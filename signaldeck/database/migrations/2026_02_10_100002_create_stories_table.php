<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('status')->default('draft'); // draft, scripted, recorded
            $table->string('tone')->nullable(); // analyst, hype
            $table->timestamps();
        });

        // Pivot table for many-to-many articles <-> stories
        Schema::create('article_story', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->cascadeOnDelete();
            $table->foreignId('story_id')->constrained()->cascadeOnDelete();
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->unique(['article_id', 'story_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article_story');
        Schema::dropIfExists('stories');
    }
};
