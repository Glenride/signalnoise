import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Monitor,
    MonitorOff,
    ScrollText,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

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

const segmentTypeStyles: Record<string, { label: string; color: string; bg: string; border: string }> = {
    hook: { label: 'Hook', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-l-red-500' },
    intro: { label: 'Intro', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-l-blue-500' },
    body: { label: 'Body', color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-l-zinc-500' },
    transition: { label: 'Transition', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-l-purple-500' },
    outro: { label: 'Outro', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-l-emerald-500' },
};

const CHANNEL_NAME = 'studio-sync';

interface StudioProps {
    story: Story;
}

export default function Studio({ story }: StudioProps) {
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(-1); // -1 = splash
    const [presentationOpen, setPresentationOpen] = useState(false);
    const [presentationTitle, setPresentationTitle] = useState(story.title);
    const [presentationSubtitle, setPresentationSubtitle] = useState('');
    const [splashPill, setSplashPill] = useState('');
    const [outroPill, setOutroPill] = useState('');
    const [teleprompterMode, setTeleprompterMode] = useState(false);
    const [prompterFontSize, setPrompterFontSize] = useState([28]);
    const presentationWindow = useRef<Window | null>(null);
    const activeSegmentRef = useRef<HTMLDivElement>(null);

    const segments = story.segments.sort((a, b) => a.order - b.order);
    const currentSegment = currentSegmentIndex >= 0 && currentSegmentIndex < segments.length
        ? segments[currentSegmentIndex]
        : null;

    // Send navigation command to presentation window
    const broadcastNavigate = useCallback((index: number) => {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage({ type: 'navigate', payload: { index } });
        channel.close();
    }, []);

    // Broadcast title/subtitle updates to presentation window
    const broadcastTitle = useCallback((title: string, subtitle: string) => {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage({ type: 'update-title', payload: { title, subtitle } });
        channel.close();
    }, []);

    const handleTitleChange = (value: string) => {
        setPresentationTitle(value);
        broadcastTitle(value, presentationSubtitle);
    };

    const handleSubtitleChange = (value: string) => {
        setPresentationSubtitle(value);
        broadcastTitle(presentationTitle, value);
    };

    // Broadcast pill updates to presentation window
    const broadcastPills = useCallback((splash: string, outro: string) => {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage({ type: 'update-pills', payload: { splashPill: splash, outroPill: outro } });
        channel.close();
    }, []);

    const handleSplashPillChange = (value: string) => {
        setSplashPill(value);
        broadcastPills(value, outroPill);
    };

    const handleOutroPillChange = (value: string) => {
        setOutroPill(value);
        broadcastPills(splashPill, value);
    };

    const navigateTo = useCallback((index: number) => {
        const clamped = Math.max(-1, Math.min(index, segments.length));
        setCurrentSegmentIndex(clamped);
        broadcastNavigate(clamped);
    }, [segments.length, broadcastNavigate]);

    const goNext = useCallback(() => {
        navigateTo(currentSegmentIndex + 1);
    }, [currentSegmentIndex, navigateTo]);

    const goPrev = useCallback(() => {
        navigateTo(currentSegmentIndex - 1);
    }, [currentSegmentIndex, navigateTo]);

    // Open presentation window
    const openPresentation = () => {
        const url = `/stories/${story.id}/studio/present`;
        const win = window.open(url, 'studio-presentation', 'width=1280,height=720');
        if (win) {
            presentationWindow.current = win;
            setPresentationOpen(true);
        }
    };

    // Listen for messages from the presentation window
    useEffect(() => {
        const channel = new BroadcastChannel(CHANNEL_NAME);

        channel.onmessage = (event) => {
            const { type, payload } = event.data;

            if (type === 'presentation-ready') {
                setPresentationOpen(true);
                // Sync current state
                broadcastNavigate(currentSegmentIndex);
            } else if (type === 'navigate-from-present') {
                // Presentation window navigated, sync back
                setCurrentSegmentIndex(payload.index);
            }
        };

        return () => channel.close();
    }, [currentSegmentIndex, broadcastNavigate]);

    // Check if presentation window closed
    useEffect(() => {
        const interval = setInterval(() => {
            if (presentationWindow.current && presentationWindow.current.closed) {
                setPresentationOpen(false);
                presentationWindow.current = null;
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Keyboard navigation (skip when focused on input fields)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;
            if (isEditable) return;

            if (e.code === 'ArrowRight' || e.code === 'ArrowDown' || e.code === 'Space') {
                e.preventDefault();
                goNext();
            } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
                e.preventDefault();
                goPrev();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goNext, goPrev]);

    // Auto-scroll active segment into view
    useEffect(() => {
        if (activeSegmentRef.current) {
            activeSegmentRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [currentSegmentIndex]);

    const isSplash = currentSegmentIndex < 0;
    const isOutro = currentSegmentIndex >= segments.length;

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-zinc-950 text-white font-sans">
            <Head title={`Studio - ${story.title}`} />

            {/* ─── Top Bar ─────────────────────────────────────── */}
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/stories/${story.id}`}
                        className="flex items-center gap-1 text-xs font-medium text-zinc-400 transition-colors hover:text-white"
                    >
                        <ChevronLeft className="h-3 w-3" />
                        Exit Studio
                    </Link>
                    <div className="h-4 w-px bg-zinc-700" />
                    <span className="text-sm font-semibold text-zinc-200 truncate max-w-[300px]">
                        {story.title}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Presentation window status */}
                    <Badge
                        variant="outline"
                        className={`gap-1.5 text-[10px] uppercase ${
                            presentationOpen
                                ? 'border-green-600/50 text-green-400'
                                : 'border-zinc-700 text-zinc-500'
                        }`}
                    >
                        <div className={`h-1.5 w-1.5 rounded-full ${presentationOpen ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
                        {presentationOpen ? 'Live' : 'Offline'}
                    </Badge>

                    <Button
                        size="sm"
                        variant={teleprompterMode ? 'default' : 'outline'}
                        className={`h-8 gap-1.5 text-xs ${teleprompterMode ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
                        onClick={() => setTeleprompterMode(!teleprompterMode)}
                    >
                        <ScrollText className="h-3.5 w-3.5" />
                        Teleprompter
                    </Button>

                    <Button
                        size="sm"
                        variant={presentationOpen ? 'outline' : 'default'}
                        className="h-8 gap-1.5 text-xs"
                        onClick={openPresentation}
                    >
                        {presentationOpen ? (
                            <>
                                <Monitor className="h-3.5 w-3.5" />
                                Reopen Window
                            </>
                        ) : (
                            <>
                                <Monitor className="h-3.5 w-3.5" />
                                Open Presentation
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* ─── Main Layout ─────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ─── Left: Segment List ──────────────────────── */}
                <div className="flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/50">
                    <div className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Segments
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {/* Splash entry */}
                        <button
                            onClick={() => navigateTo(-1)}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                                isSplash
                                    ? 'bg-blue-600/10 text-blue-400'
                                    : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                            }`}
                        >
                            <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${isSplash ? 'bg-blue-500' : 'bg-zinc-700'}`} />
                            Title Splash
                        </button>

                        {segments.map((segment, index) => {
                            const isActive = index === currentSegmentIndex;
                            const style = segmentTypeStyles[segment.type] || segmentTypeStyles.body;

                            return (
                                <button
                                    key={segment.id}
                                    onClick={() => navigateTo(index)}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                                        isActive
                                            ? `${style.bg} ${style.color}`
                                            : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                                    }`}
                                >
                                    <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                        isActive ? style.color.replace('text-', 'bg-') : 'bg-zinc-700'
                                    }`} />
                                    <span className="truncate">
                                        {style.label}: {segment.script_text.substring(0, 40)}...
                                    </span>
                                </button>
                            );
                        })}

                        {/* Outro entry */}
                        <button
                            onClick={() => navigateTo(segments.length)}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                                isOutro
                                    ? 'bg-zinc-600/10 text-zinc-300'
                                    : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                            }`}
                        >
                            <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${isOutro ? 'bg-zinc-400' : 'bg-zinc-700'}`} />
                            End Slide
                        </button>
                    </div>
                </div>

                {/* ─── Center: Script / Notes ──────────────────── */}
                <div className="flex flex-1 flex-col overflow-hidden relative">

                    {/* Teleprompter overlay */}
                    {teleprompterMode && (
                        <div className="absolute inset-0 z-30 flex flex-col bg-black">
                            {/* Prompter controls */}
                            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-6 py-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Teleprompter</span>
                                    {currentSegment && (() => {
                                        const style = segmentTypeStyles[currentSegment.type] || segmentTypeStyles.body;
                                        return (
                                            <Badge className={`${style.bg} ${style.color} border-transparent text-[10px] uppercase`}>
                                                {style.label} &middot; {currentSegmentIndex + 1}/{segments.length}
                                            </Badge>
                                        );
                                    })()}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase text-zinc-500">Size</span>
                                        <Slider
                                            value={prompterFontSize}
                                            onValueChange={setPrompterFontSize}
                                            min={18}
                                            max={56}
                                            step={2}
                                            className="w-24"
                                        />
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs text-zinc-400 hover:text-white"
                                        onClick={() => setTeleprompterMode(false)}
                                    >
                                        Exit
                                    </Button>
                                </div>
                            </div>

                            {/* Scrollable script */}
                            <div className="flex-1 overflow-y-auto px-12 select-none" style={{ scrollBehavior: 'smooth' }}>
                                <div className="py-[40vh]">
                                    {segments.map((segment, index) => {
                                        const isActive = index === currentSegmentIndex;
                                        const style = segmentTypeStyles[segment.type] || segmentTypeStyles.body;
                                        return (
                                            <div
                                                key={segment.id}
                                                ref={isActive ? activeSegmentRef : null}
                                                onClick={() => navigateTo(index)}
                                                className={`mb-10 cursor-pointer border-l-4 pl-6 transition-all duration-300 ${style.border} ${
                                                    isActive
                                                        ? 'opacity-100 scale-100'
                                                        : 'opacity-20 scale-[0.98] hover:opacity-40'
                                                }`}
                                            >
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${style.color}`}>
                                                    {style.label}
                                                </span>
                                                <p
                                                    className="mt-2 font-semibold leading-snug text-white"
                                                    style={{ fontSize: `${prompterFontSize[0]}px` }}
                                                >
                                                    {segment.script_text}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Reading line */}
                            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-40 flex -translate-y-1/2 items-center px-4">
                                <div className="h-0.5 w-6 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
                                <div className="h-px flex-1 bg-amber-500/20" />
                                <div className="h-0.5 w-6 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
                            </div>
                        </div>
                    )}

                    {/* Current slide indicator */}
                    <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/30 px-6 py-3">
                        <div className="flex items-center gap-3">
                            {isSplash && (
                                <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-[10px] uppercase">
                                    Title Splash
                                </Badge>
                            )}
                            {isOutro && (
                                <Badge className="bg-zinc-600/20 text-zinc-400 border-zinc-600/30 text-[10px] uppercase">
                                    End Slide
                                </Badge>
                            )}
                            {currentSegment && (() => {
                                const style = segmentTypeStyles[currentSegment.type] || segmentTypeStyles.body;
                                return (
                                    <Badge className={`${style.bg} ${style.color} border-transparent text-[10px] uppercase`}>
                                        {style.label} &middot; {currentSegmentIndex + 1}/{segments.length}
                                    </Badge>
                                );
                            })()}
                        </div>

                        {/* Nav buttons */}
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                                onClick={goPrev}
                                disabled={isSplash}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                                onClick={goNext}
                                disabled={isOutro}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Script content */}
                    <div className="flex-1 overflow-y-auto px-8 py-6">
                        {(isSplash || isOutro) && (
                            <div className="flex h-full flex-col items-center justify-center gap-6">
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">
                                    {isSplash ? 'Title Splash' : 'End Slide'} — Edit below
                                </p>
                                <div className="w-full max-w-md space-y-3">
                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Title</label>
                                        <Input
                                            value={presentationTitle}
                                            onChange={(e) => handleTitleChange(e.target.value)}
                                            className="border-zinc-700 bg-zinc-900 text-lg font-semibold text-zinc-100 placeholder:text-zinc-600"
                                            placeholder="Presentation title..."
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Subtitle (optional)</label>
                                        <Input
                                            value={presentationSubtitle}
                                            onChange={(e) => handleSubtitleChange(e.target.value)}
                                            className="border-zinc-700 bg-zinc-900 text-sm text-zinc-300 placeholder:text-zinc-600"
                                            placeholder="Add a subtitle..."
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                            {isSplash ? 'Splash' : 'Outro'} Badge (optional)
                                        </label>
                                        <Input
                                            value={isSplash ? splashPill : outroPill}
                                            onChange={(e) => isSplash ? handleSplashPillChange(e.target.value) : handleOutroPillChange(e.target.value)}
                                            className="border-zinc-700 bg-zinc-900 text-sm text-zinc-300 placeholder:text-zinc-600"
                                            placeholder={isSplash ? 'e.g. LIVE • March 25, 2026' : 'e.g. Thanks for watching'}
                                        />
                                    </div>
                                </div>
                                <p className="text-sm text-zinc-500">
                                    {isSplash ? (
                                        <>Press <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono">→</kbd> or <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono">Space</kbd> to begin</>
                                    ) : (
                                        <>Press <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono">←</kbd> to go back</>
                                    )}
                                </p>
                            </div>
                        )}

                        {currentSegment && (
                            <div className="space-y-6">
                                {/* Script text — the main notes */}
                                <div className={`rounded-lg border-l-4 bg-zinc-900/50 p-6 ${
                                    (segmentTypeStyles[currentSegment.type] || segmentTypeStyles.body).border
                                }`}>
                                    <p className="text-xl leading-relaxed text-zinc-100">
                                        {currentSegment.script_text}
                                    </p>
                                </div>

                                {/* Visual cue */}
                                {currentSegment.visual_cue && (
                                    <div className="rounded-lg border border-blue-900/30 bg-blue-950/20 px-4 py-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                                            Visual Cue
                                        </span>
                                        <p className="mt-1 text-sm text-blue-300/80">
                                            {currentSegment.visual_cue}
                                        </p>
                                    </div>
                                )}

                                {/* Source reference */}
                                {currentSegment.source_url && (
                                    <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3">
                                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                                        <a
                                            href={currentSegment.source_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="truncate font-mono text-xs text-zinc-400 hover:text-white transition-colors"
                                        >
                                            {currentSegment.source_url}
                                        </a>
                                    </div>
                                )}

                                {/* Image thumbnail */}
                                {currentSegment.image_url && (
                                    <div className="overflow-hidden rounded-lg border border-zinc-800">
                                        <img
                                            src={currentSegment.image_url}
                                            alt={currentSegment.visual_cue || 'Segment visual'}
                                            className="h-40 w-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* Upcoming segment preview */}
                                {currentSegmentIndex < segments.length - 1 && (
                                    <div className="mt-8 border-t border-zinc-800 pt-4">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                                            Up Next
                                        </span>
                                        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                                            {segments[currentSegmentIndex + 1].script_text.substring(0, 120)}...
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom nav bar */}
                    <div className="flex h-14 shrink-0 items-center justify-between border-t border-zinc-800 bg-zinc-900/50 px-6">
                        <div className="text-xs text-zinc-500">
                            <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono">←</kbd>
                            <span className="mx-1">Previous</span>
                        </div>

                        {/* Progress */}
                        <div className="flex items-center gap-1.5">
                            {segments.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigateTo(i)}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        i === currentSegmentIndex
                                            ? 'w-5 bg-blue-500'
                                            : i < currentSegmentIndex
                                              ? 'w-1.5 bg-zinc-600'
                                              : 'w-1.5 bg-zinc-800'
                                    }`}
                                />
                            ))}
                        </div>

                        <div className="text-xs text-zinc-500">
                            <span className="mx-1">Next</span>
                            <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono">→</kbd>
                        </div>
                    </div>
                </div>

                {/* ─── Right: References Panel ─────────────────── */}
                <div className="flex w-72 shrink-0 flex-col border-l border-zinc-800 bg-zinc-900/30">
                    <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Source Articles
                    </div>
                    <div className="flex-1 overflow-y-auto px-3 pb-3">
                        {story.articles && story.articles.length > 0 ? (
                            <div className="space-y-2">
                                {story.articles.map((article, idx) => (
                                    <a
                                        key={idx}
                                        href={article.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group flex flex-col gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
                                    >
                                        <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors line-clamp-2">
                                            {article.title}
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                                            <ExternalLink className="h-2.5 w-2.5" />
                                            {new URL(article.url).hostname.replace('www.', '')}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-zinc-600 px-1">No articles linked.</p>
                        )}
                    </div>

                    {/* Keyboard shortcuts reference */}
                    <div className="border-t border-zinc-800 px-4 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-2">
                            Shortcuts
                        </div>
                        <div className="space-y-1.5 text-[11px] text-zinc-500">
                            <div className="flex items-center justify-between">
                                <span>Next slide</span>
                                <div className="flex gap-1">
                                    <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-[9px] font-mono">→</kbd>
                                    <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-[9px] font-mono">Space</kbd>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Previous slide</span>
                                <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-[9px] font-mono">←</kbd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// HMR Force Update
