<?php

namespace App\Services;

use App\Models\Article;
use Illuminate\Support\Str;
use Carbon\Carbon;

class SignalScoreService
{
    /**
     * Calculate the Signal Score breakdown for an article.
     *
     * @param Article $article
     * @return ScoreBreakdown
     */
    public function calculate(Article $article, string $mode = 'analyst'): ScoreBreakdown
    {
        $breakdown = new ScoreBreakdown();
        $reasons = [];

        // 1. Freshness Score
        $breakdown->freshness = $this->calculateFreshness($article);
        if ($breakdown->freshness < 40 && $article->published_at) {
            $reasons[] = "Old article (" . $article->published_at->diffForHumans() . ")";
        }

        // 2. Velocity Score
        $clusterSize = Article::where('group_hash', $article->group_hash)->count();
        $breakdown->velocity = $this->calculateVelocity($clusterSize);
        if ($clusterSize > 1) {
            $reasons[] = "Covered by {$clusterSize} sources";
        }

        // 3. Credibility Score
        $url = $article->feed->url ?? $article->url;
        $domain = parse_url($url, PHP_URL_HOST);
        $domain = $domain ? str_replace('www.', '', $domain) : null;
        $breakdown->credibility = $this->calculateCredibility($domain);
        
        // 4. Impact Score
        $breakdown->impact = $this->calculateImpact($article, $reasons);

        // 5. Novelty Score
        $breakdown->novelty = $this->calculateNovelty($article, $clusterSize, $reasons);

        // 6. FormatBoost Score
        $breakdown->format = $this->calculateFormat($article, $reasons);

        // Define weights based on mode
        $weights = match($mode) {
            'hype' => [
                'impact' => 0.25,
                'velocity' => 0.30,
                'credibility' => 0.10,
                'novelty' => 0.00,
                'freshness' => 0.20,
                'format' => 0.15,
            ],
            'osint' => [
                'impact' => 0.25,
                'velocity' => 0.15,
                'credibility' => 0.35,
                'novelty' => 0.15,
                'freshness' => 0.10,
                'format' => 0.00,
            ],
            default => [ // 'analyst'
                'impact' => 0.35,
                'velocity' => 0.20,
                'credibility' => 0.25,
                'novelty' => 0.10,
                'freshness' => 0.10,
                'format' => 0.00,
            ],
        };

        // Calculate Weighted Total
        $total = ($breakdown->impact * $weights['impact']) +
                 ($breakdown->velocity * $weights['velocity']) +
                 ($breakdown->credibility * $weights['credibility']) +
                 ($breakdown->novelty * $weights['novelty']) +
                 ($breakdown->freshness * $weights['freshness']) +
                 ($breakdown->format * $weights['format']);

        $breakdown->total = (int) min(100, max(0, round($total)));
        $breakdown->reasons = array_unique($reasons);

        return $breakdown;
    }

    private function calculateFreshness(Article $article): int
    {
        if (!$article->published_at) return 0;
        
        $ageInHours = $article->published_at->diffInHours(now());

        if ($ageInHours < 1) return 100;
        if ($ageInHours < 4) return 70;
        if ($ageInHours < 12) return 40;
        if ($ageInHours < 24) return 20;
        return 0;
    }

    private function calculateVelocity(int $clusterSize): int
    {
        if ($clusterSize >= 7) return 100;
        if ($clusterSize >= 4) return 70;
        if ($clusterSize >= 2) return 40;
        return 0;
    }

    private function calculateCredibility(?string $domain): int
    {
        if (!$domain) return 50;

        $config = config('signal_sources', []);
        $tiers = $config['tiers'] ?? [];
        $scores = $config['tier_scores'] ?? [];
        $default = $config['default_score'] ?? 50;

        foreach ($tiers as $tier => $domains) {
            foreach ($domains as $d) {
                if (Str::contains($domain, $d)) {
                    return $scores[$tier] ?? $default;
                }
            }
        }

        return $default;
    }

    private function calculateImpact(Article $article, array &$reasons): int
    {
        $score = 0;
        $title = Str::lower($article->title);
        $summary = Str::lower($article->summary ?? '');
        $text = $title . ' ' . $summary;

        $severity = ['war', 'sanctions', 'indictment', 'layoffs', 'crash', 'collapse', 'assassination', 'crisis', 'attack', 'disaster', 'scandal', 'fraud', 'breach', 'hack', 'leak', 'security', 'critical', 'emergency', 'catastrophic'];
        $scope = ['nationwide', 'global', 'millions', 'billions', 'worldwide', 'historic', 'record'];
        $entities = ['white house', 'pentagon', 'kremlin', 'beijing', 'google', 'apple', 'amazon', 'tesla', 'microsoft', 'nasa', 'nato', 'un', 'u.n.', 'eu', 'fbi', 'cia', 'doj'];

        foreach ($severity as $word) {
            if (Str::contains($text, $word)) {
                $score += 20;
                if (!in_array("Impact: $word", $reasons)) $reasons[] = "Impact: $word";
            }
        }

        foreach ($scope as $word) {
            if (Str::contains($text, $word)) {
                $score += 5;
            }
        }

        foreach ($entities as $word) {
            if (Str::contains($text, $word)) {
                $score += 10;
            }
        }

        return min(100, $score);
    }

    private function calculateNovelty(Article $article, int $clusterSize, array &$reasons): int
    {
        $score = 70; // Base score
        $title = Str::lower($article->title);

        // Recap penalty
        $recaps = ['what we know', 'explained', 'recap', 'timeline', 'reaction', 'analysis', 'opinion'];
        foreach ($recaps as $word) {
            if (Str::contains($title, $word)) {
                $score -= 20;
                $reasons[] = "Penalty: Recap/Analysis";
                break; 
            }
        }

        // First in cluster boost
        if ($clusterSize > 1) {
            $oldestId = Article::where('group_hash', $article->group_hash)
                ->orderBy('published_at', 'asc')
                ->value('id');
            
            if ($oldestId === $article->id) {
                $score += 30;
                $reasons[] = "Original source (First in cluster)";
            }
        } else {
            // Keep boost small for singles so we don't overvalue obscure unique items
            $score += 10; 
        }

        return (int) min(100, max(0, $score));
    }

    private function calculateFormat(Article $article, array &$reasons): int
    {
        $score = 0;
        $title = Str::lower($article->title);
        $content = Str::lower($article->content ?? '');
        $text = $title . ' ' . $content;
        
        $keywords = ['video', 'footage', 'leaked audio', 'document', 'report', 'court filing', 'map', 'transcript', 'pdf', 'live stream'];

        foreach ($keywords as $word) {
            if (Str::contains($text, $word)) {
                $score += 15;
                if (!in_array("Asset: $word", $reasons)) $reasons[] = "Asset: $word";
            }
        }
        
        return min(100, $score);
    }
}
