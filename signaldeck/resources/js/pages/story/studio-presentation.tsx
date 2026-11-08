import { Head } from '@inertiajs/react';
import React, { useEffect, useState, useCallback } from 'react';

interface Segment {
    id: number;
    type: 'hook' | 'intro' | 'body' | 'transition' | 'outro';
    script_text: string;
    source_url?: string;
    image_url?: string;
    visual_cue?: string;
    order: number;
}

interface Story {
    id: number;
    title: string;
    segments: Segment[];
    articles?: { url: string; title: string; content: string }[];
}

interface PresentationProps {
    story: Story;
}

type SlideState = 'splash' | 'segment' | 'outro';

const CHANNEL_NAME = 'studio-sync';

export default function StudioPresentation({ story }: PresentationProps) {
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(-1); // -1 = splash
    const [slideState, setSlideState] = useState<SlideState>('splash');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [presentationTitle, setPresentationTitle] = useState(story.title);
    const [presentationSubtitle, setPresentationSubtitle] = useState('');

    const segments = story.segments.sort((a, b) => a.order - b.order);

    const [splashPill, setSplashPill] = useState('');
    const [outroPill, setOutroPill] = useState('');

    const navigateToSegment = useCallback((index: number) => {
        setIsTransitioning(true);

        setTimeout(() => {
            if (index < 0) {
                setSlideState('splash');
                setCurrentSegmentIndex(-1);
            } else if (index >= segments.length) {
                setSlideState('outro');
                setCurrentSegmentIndex(segments.length);
            } else {
                setSlideState('segment');
                setCurrentSegmentIndex(index);
            }

            setTimeout(() => setIsTransitioning(false), 50);
        }, 400);
    }, [segments.length]);

    // Listen for messages from control panel via BroadcastChannel
    useEffect(() => {
        const channel = new BroadcastChannel(CHANNEL_NAME);

        channel.onmessage = (event) => {
            const { type, payload } = event.data;

            if (type === 'navigate') {
                navigateToSegment(payload.index);
            } else if (type === 'update-title') {
                if (payload.title !== undefined) setPresentationTitle(payload.title);
                if (payload.subtitle !== undefined) setPresentationSubtitle(payload.subtitle);
            } else if (type === 'update-pills') {
                if (payload.splashPill !== undefined) setSplashPill(payload.splashPill);
                if (payload.outroPill !== undefined) setOutroPill(payload.outroPill);
            } else if (type === 'ping') {
                channel.postMessage({
                    type: 'pong',
                    payload: { storyId: story.id, currentIndex: currentSegmentIndex },
                });
            }
        };

        // Announce that presentation window is ready
        channel.postMessage({
            type: 'presentation-ready',
            payload: { storyId: story.id },
        });

        return () => channel.close();
    }, [story.id, currentSegmentIndex, navigateToSegment]);

    // Keyboard navigation (for standalone use)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'ArrowRight' || e.code === 'ArrowDown' || e.code === 'Space') {
                e.preventDefault();
                const nextIndex = currentSegmentIndex + 1;
                navigateToSegment(nextIndex);
                // Broadcast back to control panel
                const channel = new BroadcastChannel(CHANNEL_NAME);
                channel.postMessage({ type: 'navigate-from-present', payload: { index: nextIndex } });
                channel.close();
            } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = currentSegmentIndex - 1;
                navigateToSegment(prevIndex);
                const channel = new BroadcastChannel(CHANNEL_NAME);
                channel.postMessage({ type: 'navigate-from-present', payload: { index: prevIndex } });
                channel.close();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSegmentIndex, navigateToSegment]);

    const currentSegment = segments[currentSegmentIndex] ?? null;

    return (
        <div className="h-screen w-screen overflow-hidden bg-zinc-950 text-white">
            <Head title={`Present - ${story.title}`} />

            {/* Transition overlay */}
            <div
                className={`pointer-events-none fixed inset-0 z-50 bg-zinc-950 transition-opacity duration-400 ease-in-out ${
                    isTransitioning ? 'opacity-100' : 'opacity-0'
                }`}
            />

            {/* Splash Screen */}
            {slideState === 'splash' && (
                <SplashSlide title={presentationTitle} subtitle={presentationSubtitle} pill={splashPill} />
            )}

            {/* Segment Content */}
            {slideState === 'segment' && currentSegment && (
                <SegmentSlide
                    segment={currentSegment}
                    segmentIndex={currentSegmentIndex}
                    totalSegments={segments.length}
                    storyTitle={presentationTitle}
                />
            )}

            {/* Outro Screen */}
            {slideState === 'outro' && (
                <OutroSlide title={presentationTitle} subtitle={presentationSubtitle} pill={outroPill} />
            )}
        </div>
    );
}

// ─── Splash Slide ────────────────────────────────────────────────────────────

function SplashSlide({ title, subtitle, pill }: { title: string; subtitle: string; pill: string }) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            {/* Subtle animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -left-1/4 -top-1/4 h-[150%] w-[150%] animate-[spin_60s_linear_infinite] opacity-[0.03]">
                    <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 blur-3xl" />
                </div>
            </div>

            <div className="relative z-10 flex max-w-4xl flex-col items-center gap-8 px-12 text-center">
                {/* Accent line */}
                <div className="flex items-center gap-3">
                    <div className="h-px w-16 bg-gradient-to-r from-transparent to-blue-500" />
                    <div className="h-px w-16 bg-gradient-to-l from-transparent to-blue-500" />
                </div>

                {/* Title */}
                <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
                    {title}
                </h1>

                {/* Subtitle */}
                {subtitle && (
                    <p className="text-xl font-medium text-zinc-400">
                        {subtitle}
                    </p>
                )}

                {/* Pill badge */}
                {pill && (
                    <div className="mt-4 flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-5 py-2.5 backdrop-blur">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                        <span className="text-sm font-medium text-zinc-400">
                            {pill}
                        </span>
                    </div>
                )}

                {/* Decorative dots */}
                <div className="mt-4 flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-1 rounded-full bg-zinc-700 transition-all duration-500"
                            style={{ width: i === 2 ? '2rem' : '0.5rem', opacity: i === 2 ? 1 : 0.4 }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Segment Slide ───────────────────────────────────────────────────────────

const segmentAccents: Record<string, { gradient: string; label: string; accent: string }> = {
    hook: { gradient: 'from-red-600/20 to-transparent', label: 'Hook', accent: 'bg-red-500' },
    intro: { gradient: 'from-blue-600/20 to-transparent', label: 'Intro', accent: 'bg-blue-500' },
    body: { gradient: 'from-zinc-600/20 to-transparent', label: 'Segment', accent: 'bg-zinc-500' },
    transition: { gradient: 'from-purple-600/20 to-transparent', label: 'Transition', accent: 'bg-purple-500' },
    outro: { gradient: 'from-emerald-600/20 to-transparent', label: 'Outro', accent: 'bg-emerald-500' },
};

function SegmentSlide({
    segment,
    segmentIndex,
    totalSegments,
    storyTitle,
}: {
    segment: Segment;
    segmentIndex: number;
    totalSegments: number;
    storyTitle: string;
}) {
    const accent = segmentAccents[segment.type] || segmentAccents.body;

    return (
        <div className="flex h-full w-full flex-col">
            {/* Top bar with progress */}
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-zinc-800/50 bg-zinc-950 px-6">
                <span className="text-[11px] font-medium text-zinc-500">
                    {storyTitle}
                </span>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalSegments }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    i === segmentIndex
                                        ? `w-4 ${accent.accent}`
                                        : i < segmentIndex
                                          ? 'w-1.5 bg-zinc-600'
                                          : 'w-1.5 bg-zinc-800'
                                }`}
                            />
                        ))}
                    </div>
                    <span className="text-[11px] tabular-nums text-zinc-600">
                        {segmentIndex + 1}/{totalSegments}
                    </span>
                </div>
            </div>

            {/* Main content area */}
            <div className="relative flex flex-1 overflow-hidden">
                {/* Accent gradient background */}
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.gradient}`} />

                {segment.image_url ? (
                    <ImageLayout segment={segment} accent={accent} />
                ) : (
                    <TitleCardLayout segment={segment} accent={accent} />
                )}
            </div>
        </div>
    );
}

// Layout when segment has an image — full-screen image with minimal overlay
function ImageLayout({
    segment,
    accent,
}: {
    segment: Segment;
    accent: { gradient: string; label: string; accent: string };
}) {
    return (
        <div className="relative flex h-full w-full">
            <img
                src={segment.image_url}
                alt={segment.visual_cue || 'Visual'}
                className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Subtle gradient at bottom for badge legibility */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950/80 to-transparent" />

            {/* Bottom bar: type badge + visual cue headline + source */}
            <div className="relative z-10 mt-auto flex w-full items-end justify-between px-10 pb-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${accent.accent}`} />
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                            {accent.label}
                        </span>
                    </div>
                    {segment.visual_cue && (
                        <p className="max-w-2xl text-2xl font-semibold text-white md:text-3xl">
                            {segment.visual_cue}
                        </p>
                    )}
                </div>
                {segment.source_url && (
                    <span className="shrink-0 rounded-full border border-zinc-700/50 bg-zinc-900/60 px-3 py-1.5 font-mono text-[10px] text-zinc-500 backdrop-blur">
                        {(() => { try { return new URL(segment.source_url).hostname.replace('www.', ''); } catch { return segment.source_url; } })()}
                    </span>
                )}
            </div>
        </div>
    );
}

// Layout for segments with no image — show visual cue or type as a title card
function TitleCardLayout({
    segment,
    accent,
}: {
    segment: Segment;
    accent: { gradient: string; label: string; accent: string };
}) {
    return (
        <div className="flex h-full w-full items-center justify-center px-16 py-12">
            <div className="flex max-w-4xl flex-col items-center gap-8 text-center">
                {/* Segment type badge */}
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${accent.accent}`} />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                        {accent.label}
                    </span>
                </div>

                {/* Visual cue as headline */}
                {segment.visual_cue && (
                    <h2 className="text-3xl font-bold leading-snug text-zinc-100 md:text-4xl lg:text-5xl">
                        {segment.visual_cue}
                    </h2>
                )}

                {/* Divider */}
                {(segment.visual_cue && segment.script_text) && (
                    <div className="flex items-center gap-3">
                        <div className="h-px w-16 bg-gradient-to-r from-transparent to-zinc-700" />
                        <div className="h-px w-16 bg-gradient-to-l from-transparent to-zinc-700" />
                    </div>
                )}

                {/* Script text */}
                {segment.script_text && (
                    <p className="max-w-3xl text-xl leading-relaxed text-zinc-300 md:text-2xl">
                        {segment.script_text}
                    </p>
                )}

                {/* Source pill */}
                {segment.source_url && (
                    <span className="mt-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 font-mono text-[11px] text-zinc-500">
                        {(() => { try { return new URL(segment.source_url).hostname.replace('www.', ''); } catch { return segment.source_url; } })()}
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Outro Slide ─────────────────────────────────────────────────────────────

function OutroSlide({ title, subtitle, pill }: { title: string; subtitle: string; pill: string }) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/5 blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6 text-center">
                <div className="flex items-center gap-3">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-zinc-600" />
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-zinc-600" />
                </div>

                <h2 className="text-4xl font-bold text-zinc-300 md:text-5xl">
                    {title}
                </h2>

                {subtitle && (
                    <p className="text-lg text-zinc-500">
                        {subtitle}
                    </p>
                )}

                {/* Pill badge */}
                {pill && (
                    <div className="mt-4 flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-5 py-2.5 backdrop-blur">
                        <div className="h-2 w-2 rounded-full bg-zinc-600" />
                        <span className="text-sm text-zinc-500">
                            {pill}
                        </span>
                    </div>
                )}

                {/* Decorative dots */}
                <div className="mt-4 flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-1 rounded-full bg-zinc-700 transition-all duration-500"
                            style={{ width: i === 2 ? '2rem' : '0.5rem', opacity: i === 2 ? 1 : 0.4 }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
