import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    FileText,
    Sparkles,
    Loader2,
    Save,
    X,
    Flame,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

interface ArticleInfo {
    id: number;
    title: string;
    feed?: { name: string };
    feed_name?: string;
    signal_score?: number;
    source?: string;
    ai_facts?: string[];
}

interface GeneratedSegment {
    type: string;
    text: string;
    visual_cue?: string;
    source_index?: number;
}

interface ScriptDropZoneProps {
    selectedArticles: ArticleInfo[];
    onRemoveArticle?: (id: number) => void;
    onClearAll?: () => void;
    selectedFacts?: Record<number, string[]>;
    onToggleFact?: (articleId: number, fact: string) => void;
}

export function ScriptDropZone({
    selectedArticles,
    onRemoveArticle,
    onClearAll,
    selectedFacts = {},
    onToggleFact,
}: ScriptDropZoneProps) {
    const [tone, setTone] = useState<string>('Analyst');
    const [segments, setSegments] = useState<GeneratedSegment[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showArticles, setShowArticles] = useState(true);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setSegments([]);

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch('/scripts/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    article_ids: selectedArticles.map((a) => a.id),
                    tone,
                    selected_facts: selectedFacts,
                }),
            });

            if (!response.ok) {
                let errorMsg = 'Generation failed';
                try {
                    const text = await response.text();
                    console.error('Script generate failed:', response.status, response.statusText, text.substring(0, 500));
                    const data = JSON.parse(text);
                    errorMsg = data.error || data.message || errorMsg;
                } catch (parseErr) {
                    console.error('Could not parse error response:', parseErr);
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            setSegments(data.segments || []);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveAsStory = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch('/scripts/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    article_ids: selectedArticles.map((a) => a.id),
                    tone,
                    segments: segments.map((s) => ({
                        type: s.type,
                        text: s.text,
                        source_index: s.source_index,
                        visual_cue: s.visual_cue,
                    })),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Save failed');
            }

            const data = await response.json();
            if (data.redirect) {
                window.location.href = data.redirect;
            }
        } catch (err: any) {
            setError(err.message || 'Failed to save story');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSegmentEdit = (index: number, text: string) => {
        setSegments((prev) =>
            prev.map((seg, i) => (i === index ? { ...seg, text } : seg)),
        );
    };

    const segmentTypeColor = (type: string) => {
        switch (type) {
            case 'hook':
                return 'bg-red-500/10 text-red-600 border-red-500/30';
            case 'intro':
                return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
            case 'transition':
                return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
            case 'outro':
                return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
            default:
                return 'bg-gray-500/10 text-gray-600 border-gray-500/30';
        }
    };

    // Empty state
    if (selectedArticles.length === 0 && segments.length === 0) {
        return (
            <Card className="flex h-full flex-col items-center justify-center border-2 border-dashed bg-muted/50 p-6 text-center text-muted-foreground">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
                    <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                    Script Builder
                </h3>
                <p className="mt-1 max-w-[200px] text-sm">
                    Select articles from the list to start building your script.
                </p>
            </Card>
        );
    }

    return (
        <div className="flex h-full flex-col space-y-4 min-h-0">
            <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <FileText className="h-5 w-5" />
                    Script Builder
                </h3>
                {segments.length === 0 && onClearAll && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearAll}
                        className="text-xs text-muted-foreground"
                    >
                        Clear All
                    </Button>
                )}
            </div>

            {/* Selected Articles */}
            {selectedArticles.length > 0 && segments.length === 0 && (
                <div className="space-y-2">
                    <button
                        onClick={() => setShowArticles(!showArticles)}
                        className="flex w-full items-center gap-1 text-xs font-semibold uppercase text-muted-foreground"
                    >
                        {selectedArticles.length} Article
                        {selectedArticles.length !== 1 ? 's' : ''} Selected
                        {showArticles ? (
                            <ChevronUp className="h-3 w-3" />
                        ) : (
                            <ChevronDown className="h-3 w-3" />
                        )}
                    </button>

                    {showArticles && (
                        <div className="max-h-[200px] space-y-1.5 overflow-y-auto">
                            {selectedArticles.map((article) => (
                                <div
                                    key={article.id}
                                    className="group flex items-start gap-2 rounded-md border bg-card p-2 text-xs"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-foreground">
                                            {article.title}
                                        </p>
                                        <div className="mt-0.5 flex items-center gap-1.5">
                                            <Badge
                                                variant="outline"
                                                className="px-1 py-0 text-[10px]"
                                            >
                                                {article.feed?.name ||
                                                    article.feed_name ||
                                                    article.source ||
                                                    'Feed'}
                                            </Badge>
                                            {(article.signal_score ?? 0) >
                                                0 && (
                                                    <Badge
                                                        className={`gap-0.5 px-1 py-0 text-[10px] ${(article.signal_score ??
                                                            0) >= 80
                                                            ? 'bg-red-500'
                                                            : (article.signal_score ??
                                                                0) >= 50
                                                                ? 'bg-orange-500'
                                                                : 'bg-gray-500'
                                                            }`}
                                                    >
                                                        <Flame className="h-2.5 w-2.5" />
                                                        {article.signal_score}
                                                    </Badge>
                                                )}
                                        </div>

                                        {/* Facts Selection */}
                                        {article.ai_facts && article.ai_facts.length > 0 && onToggleFact && (
                                            <div className="mt-2 space-y-1 pl-1 border-l-2 border-muted">
                                                <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Select Key Facts</p>
                                                {article.ai_facts.map((fact, factIdx) => {
                                                    const isChecked = selectedFacts[article.id]?.includes(fact);
                                                    return (
                                                        <div key={factIdx} className="flex items-start gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`fact-${article.id}-${factIdx}`}
                                                                checked={isChecked || false}
                                                                onChange={() => onToggleFact(article.id, fact)}
                                                                className="mt-0.5 h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary"
                                                            />
                                                            <label htmlFor={`fact-${article.id}-${factIdx}`} className="text-[10px] leading-tight text-muted-foreground cursor-pointer select-none">
                                                                {fact}
                                                            </label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    {onRemoveArticle && (
                                        <button
                                            onClick={() =>
                                                onRemoveArticle(article.id)
                                            }
                                            className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tone Selector + Generate */}
            {segments.length === 0 && (
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Tone
                        </label>
                        <Select value={tone} onValueChange={setTone}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Analyst">
                                    Analyst (Formal)
                                </SelectItem>
                                <SelectItem value="Hype">
                                    Hype (High Energy)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || selectedArticles.length === 0}
                        className="w-full"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Script
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-600">
                    {error}
                </div>
            )}

            {/* Generated Script Preview */}
            {segments.length > 0 && (
                <div className="flex flex-1 flex-col space-y-3 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Generated Script
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => setSegments([])}
                        >
                            Regenerate
                        </Button>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                        {segments.map((segment, idx) => (
                            <div key={idx} className="space-y-1">
                                <Badge
                                    variant="outline"
                                    className={`text-[10px] uppercase ${segmentTypeColor(segment.type)}`}
                                >
                                    {segment.type}
                                </Badge>
                                <Textarea
                                    value={segment.text}
                                    onChange={(e) =>
                                        handleSegmentEdit(idx, e.target.value)
                                    }
                                    className="min-h-[80px] resize-y text-sm leading-relaxed"
                                />
                                {segment.visual_cue && (
                                    <p className="text-[10px] italic text-blue-500">
                                        Cue: {segment.visual_cue}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={handleSaveAsStory}
                        disabled={isSaving}
                        className="w-full shrink-0"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save as Story
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
