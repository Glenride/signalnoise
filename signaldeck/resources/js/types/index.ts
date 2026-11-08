export type * from './auth';
export type * from './navigation';
export type * from './ui';

import type { Auth } from './auth';

// ── Domain Models ──────────────────────────────────

export type Feed = {
    id: number;
    user_id: number;
    name: string;
    url: string;
    category: 'politics' | 'tech' | 'finance' | 'world';
    is_active: boolean;
    last_synced_at: string | null;
    articles_count?: number;
    created_at: string;
    updated_at: string;
};

export type ScoreBreakdown = {
    total: number;
    freshness: number;
    velocity: number;
    credibility: number;
    impact: number;
    novelty: number;
    format: number;
    reasons: string[];
};

export type Article = {
    id: number;
    feed_id: number;
    title: string;
    url: string;
    author: string | null;
    summary: string | null;
    content: string | null;
    published_at: string | null;
    group_hash: string;
    signal_score: number | null;
    signal_breakdown?: ScoreBreakdown;
    signal_flags: string[] | null;
    feed_name?: string;
    created_at: string;
    updated_at: string;
};

export type Story = {
    id: number;
    user_id: number;
    title: string;
    status: 'draft' | 'scripted' | 'recorded';
    tone: 'analyst' | 'hype' | null;
    articles?: Article[];
    segments?: Segment[];
    created_at: string;
    updated_at: string;
};

export type Segment = {
    id: number;
    story_id: number;
    order: number;
    type: 'hook' | 'body' | 'outro';
    script_text: string;
    source_url: string | null;
    created_at: string;
    updated_at: string;
};

export type SharedData = {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
};
