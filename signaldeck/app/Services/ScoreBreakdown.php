<?php

namespace App\Services;

class ScoreBreakdown implements \JsonSerializable
{
    public function __construct(
        public int $total = 0,
        public int $freshness = 0,
        public int $velocity = 0,
        public int $credibility = 0,
        public int $impact = 0,
        public int $novelty = 0,
        public int $format = 0,
        public array $reasons = []
    ) {}

    public function jsonSerialize(): array
    {
        return [
            'total' => $this->total,
            'freshness' => $this->freshness,
            'velocity' => $this->velocity,
            'credibility' => $this->credibility,
            'impact' => $this->impact,
            'novelty' => $this->novelty,
            'format' => $this->format,
            'reasons' => $this->reasons,
        ];
    }
}
