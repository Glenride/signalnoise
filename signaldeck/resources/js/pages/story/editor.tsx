import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import ReaderView from '@/components/reader-view';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Save, RefreshCw, Loader2, Sparkles, X, Monitor, CheckCircle, RotateCcw, Image as ImageIcon, Upload, Link2, Trash2 } from 'lucide-react';

interface Segment {
    id: number;
    type: string;
    script_text: string;
    visual_cue?: string;
    image_url?: string;
}

interface Story {
    id: number;
    title: string;
    status: string;
    tone: string | null;
    segments: Segment[];
    articles: { id: number; title: string; url: string; content?: string }[];
}

interface StoryEditorProps {
    story: Story;
}

const segmentTypeStyles: Record<string, { label: string; color: string; border: string }> = {
    hook: { label: 'Hook', color: 'text-red-500', border: 'border-l-red-500' },
    intro: { label: 'Intro', color: 'text-blue-500', border: 'border-l-blue-500' },
    body: { label: 'Body', color: 'text-gray-500', border: 'border-l-gray-400' },
    transition: { label: 'Transition', color: 'text-purple-500', border: 'border-l-purple-500' },
    outro: { label: 'Outro', color: 'text-emerald-500', border: 'border-l-emerald-500' },
};

export default function StoryEditor({ story }: StoryEditorProps) {
    const [segments, setSegments] = useState(story.segments);
    const [activeSourceUrl, setActiveSourceUrl] = useState<string | null>(
        story.articles[0]?.url || null,
    );
    const [regeneratingId, setRegeneratingId] = useState<number | null>(null);
    const [generatingImageId, setGeneratingImageId] = useState<number | null>(null);
    const [regeneratingAll, setRegeneratingAll] = useState(false);
    const [instructionSegmentId, setInstructionSegmentId] = useState<number | null>(null);
    const [instruction, setInstruction] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
    const [imageInputSegmentId, setImageInputSegmentId] = useState<number | null>(null);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [uploadingImageId, setUploadingImageId] = useState<number | null>(null);

    const handleTextChange = (id: number, text: string) => {
        setSegments((prev) =>
            prev.map((seg) =>
                seg.id === id ? { ...seg, script_text: text } : seg,
            ),
        );
    };

    const handleGenerateImage = async (segmentId: number, visualCue: string | undefined) => {
        setGeneratingImageId(segmentId);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/segments/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    segment_id: segmentId,
                    prompt: visualCue
                }),
            });

            if (!response.ok) throw new Error('Failed to generate image');

            const data = await response.json();

            // Update local state with new image URL
            setSegments((prev) =>
                prev.map((seg) =>
                    seg.id === segmentId ? { ...seg, image_url: data.image_url } : seg,
                ),
            );

        } catch (error) {
            console.error('Image generation failed:', error);
            alert('Failed to generate image. Please try again.');
        } finally {
            setGeneratingImageId(null);
        }
    };

    const handleSetImageUrl = async (segmentId: number) => {
        if (!imageUrlInput.trim()) return;
        setUploadingImageId(segmentId);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/segments/set-image-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken || '', Accept: 'application/json' },
                body: JSON.stringify({ segment_id: segmentId, image_url: imageUrlInput.trim() }),
            });
            if (!response.ok) throw new Error('Failed to set image URL');
            const data = await response.json();
            setSegments((prev) => prev.map((seg) => seg.id === segmentId ? { ...seg, image_url: data.image_url } : seg));
            setImageInputSegmentId(null);
            setImageUrlInput('');
        } catch (error) {
            console.error('Set image URL failed:', error);
        } finally {
            setUploadingImageId(null);
        }
    };

    const handleUploadImage = async (segmentId: number, file: File) => {
        setUploadingImageId(segmentId);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const formData = new FormData();
            formData.append('segment_id', String(segmentId));
            formData.append('image', file);
            const response = await fetch('/segments/upload-image', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken || '', Accept: 'application/json' },
                body: formData,
            });
            if (!response.ok) throw new Error('Failed to upload image');
            const data = await response.json();
            setSegments((prev) => prev.map((seg) => seg.id === segmentId ? { ...seg, image_url: data.image_url } : seg));
        } catch (error) {
            console.error('Image upload failed:', error);
        } finally {
            setUploadingImageId(null);
        }
    };

    const handleRemoveImage = async (segmentId: number) => {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            await fetch('/segments/remove-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken || '', Accept: 'application/json' },
                body: JSON.stringify({ segment_id: segmentId }),
            });
            setSegments((prev) => prev.map((seg) => seg.id === segmentId ? { ...seg, image_url: undefined } : seg));
        } catch (error) {
            console.error('Remove image failed:', error);
        }
    };

    const handleRegenerate = async (segmentId: number, customInstruction?: string) => {
        setRegeneratingId(segmentId);

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch('/scripts/regenerate-segment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    segment_id: segmentId,
                    story_id: story.id,
                    instruction: customInstruction || null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Regeneration failed');
            }

            const data = await response.json();

            setSegments((prev) =>
                prev.map((seg) =>
                    seg.id === data.segment_id
                        ? { ...seg, script_text: data.text, visual_cue: data.visual_cue || seg.visual_cue }
                        : seg,
                ),
            );

            // Close instruction input after successful regen
            setInstructionSegmentId(null);
            setInstruction('');
        } catch (err: any) {
            console.error('Regen failed:', err.message);
        } finally {
            setRegeneratingId(null);
        }
    };

    const handleSave = async (silent = false) => {
        if (!silent) setIsSaving(true);
        setSaveStatus('idle');

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch(`/stories/${story.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    segments: segments.map((s) => ({
                        id: s.id,
                        script_text: s.script_text,
                        visual_cue: s.visual_cue, // Ensure visual_cue is saved
                    })),
                }),
            });

            if (response.ok) {
                setSaveStatus('saved');
                if (!silent) setTimeout(() => setSaveStatus('idle'), 2000);
                return true;
            } else {
                setSaveStatus('error');
                return false;
            }
        } catch {
            setSaveStatus('error');
            return false;
        } finally {
            if (!silent) setIsSaving(false);
        }
    };

    const handleFinalize = async () => {
        // if (!confirm('Ready to finalize this story and enter the studio?')) return;

        // Save first
        const saved = await handleSave(true);
        if (!saved) {
            alert('Failed to save story changes. Please try again.');
            return;
        }

        // Update status via Inertia or fetch
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            await fetch(`/stories/${story.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ status: 'final' }),
            });

            // Navigate to Studio
            router.visit(`/stories/${story.id}/studio`);
        } catch (error) {
            console.error('Finalize failed', error);
            alert('Could not finalize story.');
        }
    };

    const handleRevertToDraft = async () => {
        // if (!confirm('Revert status to draft?')) return;

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            await fetch(`/stories/${story.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ status: 'draft' }),
            });

            // Reload page to reflect status
            router.reload();
        } catch (error) {
            console.error('Revert failed', error);
        }
    };

    const handleRegenerateAll = async () => {
        // if (!confirm('This will replace all segments with a fresh AI-generated script. Continue?')) return;

        setRegeneratingAll(true);

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch('/scripts/regenerate-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    story_id: story.id,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Regeneration failed');
            }

            const data = await response.json();
            setSegments(data.segments || []);
        } catch (err: any) {
            console.error('Regenerate all failed:', err.message);
            alert('Failed to regenerate: ' + err.message);
        } finally {
            setRegeneratingAll(false);
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Stories', href: '/stories' },
                { title: 'Editor', href: '#' },
            ]}
        >
            <Head title={`Editor: ${story.title}`} />

            <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
                {/* Left Panel: Script Editor */}
                <div className="flex w-1/3 min-w-[320px] flex-col border-r bg-background">
                    <div className="relative z-20 flex flex-col gap-2 border-b bg-background p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Link href="/stories">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <h2 className="truncate font-semibold text-sm" title={story.title}>
                                    {story.title}
                                </h2>
                            </div>
                            {/* Status Badge */}
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${story.status === 'final' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                {story.status}
                            </span>
                        </div>

                        <div className="relative z-30 flex items-center justify-end gap-2 pt-1">
                            {story.status === 'draft' && (
                                <>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-8 gap-1.5 text-xs"
                                        onClick={handleRegenerateAll}
                                        disabled={regeneratingAll}
                                    >
                                        {regeneratingAll ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-3.5 w-3.5" />
                                        )}
                                        Regen
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-8 gap-1.5 text-xs"
                                        onClick={() => handleSave()}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Save className="h-3.5 w-3.5" />
                                        )}
                                        {saveStatus === 'saved' ? 'Saved' : 'Save'}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="h-8 gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white"
                                        onClick={handleFinalize}
                                    >
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        Finalize
                                    </Button>
                                </>
                            )}

                            {story.status === 'final' && (
                                <>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 gap-1.5 text-xs text-muted-foreground"
                                        onClick={handleRevertToDraft}
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        Revert
                                    </Button>
                                    <Link href={`/stories/${story.id}/studio`}>
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="h-8 gap-1.5 text-xs"
                                        >
                                            <Monitor className="h-3.5 w-3.5" />
                                            Enter Studio
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto p-4">
                        {segments.map((segment) => {
                            const style = segmentTypeStyles[segment.type] || segmentTypeStyles.body;
                            const isRegenerating = regeneratingId === segment.id;
                            const isGeneratingImage = generatingImageId === segment.id;
                            const showInstruction = instructionSegmentId === segment.id;

                            return (
                                <div
                                    key={segment.id}
                                    className={`group relative rounded-lg border-l-4 bg-card p-3 shadow-sm transition-shadow hover:shadow-md ${style.border}`}
                                >
                                    {/* Segment Header */}
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${style.color}`}>
                                            {style.label}
                                        </span>

                                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                            {/* Generate Image Button */}
                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={`h-7 w-7 ${segment.image_url ? 'text-primary' : ''}`}
                                                            onClick={() => handleGenerateImage(segment.id, segment.visual_cue)}
                                                            disabled={isGeneratingImage || isRegenerating}
                                                        >
                                                            {isGeneratingImage ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <ImageIcon className="h-3.5 w-3.5" />
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{segment.image_url ? 'Regenerate Image' : 'Generate AI Image'}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            {/* Regenerate with instruction toggle */}
                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => {
                                                                if (showInstruction) {
                                                                    setInstructionSegmentId(null);
                                                                    setInstruction('');
                                                                } else {
                                                                    setInstructionSegmentId(segment.id);
                                                                    setInstruction('');
                                                                }
                                                            }}
                                                            disabled={isRegenerating}
                                                        >
                                                            <Sparkles className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Rewrite with instructions</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            {/* Quick regenerate */}
                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => handleRegenerate(segment.id)}
                                                            disabled={isRegenerating}
                                                        >
                                                            {isRegenerating ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <RefreshCw className="h-3.5 w-3.5" />
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Quick regenerate</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>

                                    {/* Instruction Input */}
                                    {showInstruction && (
                                        <div className="mb-2 flex gap-1.5">
                                            <Input
                                                value={instruction}
                                                onChange={(e) => setInstruction(e.target.value)}
                                                placeholder="e.g. Make it more dramatic, add statistics..."
                                                className="h-8 text-xs"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleRegenerate(segment.id, instruction);
                                                    }
                                                }}
                                                autoFocus
                                            />
                                            <Button
                                                size="sm"
                                                className="h-8 gap-1 px-2 text-xs"
                                                onClick={() => handleRegenerate(segment.id, instruction)}
                                                disabled={isRegenerating}
                                            >
                                                {isRegenerating ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Sparkles className="h-3 w-3" />
                                                )}
                                                Go
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => {
                                                    setInstructionSegmentId(null);
                                                    setInstruction('');
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}

                                    {/* Script Text */}
                                    <Textarea
                                        value={segment.script_text}
                                        onChange={(e) =>
                                            handleTextChange(segment.id, e.target.value)
                                        }
                                        className={`min-h-[80px] resize-y border-0 bg-transparent p-0 text-sm leading-relaxed shadow-none focus-visible:ring-0 ${isRegenerating ? 'animate-pulse opacity-50' : ''}`}
                                        disabled={isRegenerating}
                                    />

                                    {/* Visual Cue */}
                                    {segment.visual_cue && (
                                        <div className="mt-2 text-[10px] italic text-blue-500">
                                            🎬 {segment.visual_cue}
                                        </div>
                                    )}

                                    {/* Image area */}
                                    {segment.image_url ? (
                                        <div className="mt-2 flex items-start gap-2">
                                            <img
                                                src={segment.image_url}
                                                alt="Segment visual"
                                                className="h-20 w-32 rounded border object-cover shadow-sm"
                                            />
                                            <div className="flex flex-col gap-1">
                                                <TooltipProvider delayDuration={0}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                                onClick={() => handleRemoveImage(segment.id)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Remove image</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </div>
                                    ) : (
                                        imageInputSegmentId === segment.id ? (
                                            <div className="mt-2 space-y-2">
                                                <div className="flex gap-1.5">
                                                    <Input
                                                        value={imageUrlInput}
                                                        onChange={(e) => setImageUrlInput(e.target.value)}
                                                        placeholder="https://example.com/image.jpg"
                                                        className="h-8 text-xs"
                                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSetImageUrl(segment.id); }}
                                                        autoFocus
                                                    />
                                                    <Button
                                                        size="sm"
                                                        className="h-8 px-2 text-xs"
                                                        onClick={() => handleSetImageUrl(segment.id)}
                                                        disabled={uploadingImageId === segment.id}
                                                    >
                                                        {uploadingImageId === segment.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Set'}
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setImageInputSegmentId(null); setImageUrlInput(''); }}>
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-muted-foreground">or</span>
                                                    <label className="cursor-pointer text-[10px] font-medium text-primary hover:underline">
                                                        Upload a file
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleUploadImage(segment.id, file);
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <TooltipProvider delayDuration={0}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 gap-1 px-1.5 text-[10px] text-muted-foreground"
                                                                onClick={() => { setImageInputSegmentId(segment.id); setImageUrlInput(''); }}
                                                            >
                                                                <Link2 className="h-3 w-3" />
                                                                URL
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Add image from URL</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <TooltipProvider delayDuration={0}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <label className="cursor-pointer">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 gap-1 px-1.5 text-[10px] text-muted-foreground pointer-events-none"
                                                                    asChild
                                                                >
                                                                    <span><Upload className="h-3 w-3" />Upload</span>
                                                                </Button>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) handleUploadImage(segment.id, file);
                                                                    }}
                                                                />
                                                            </label>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Upload image file</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                {uploadingImageId === segment.id && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                            </div>
                                        )
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Panel: Source Viewer */}
                <div className="flex flex-1 flex-col bg-muted/20">
                    <div className="flex gap-2 overflow-x-auto border-b bg-background p-2">
                        {story.articles.map((article, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveSourceUrl(article.url)}
                                className={`rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-colors ${activeSourceUrl === article.url
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'bg-background hover:bg-muted'
                                    }`}
                            >
                                {article.title.substring(0, 30)}...
                            </button>
                        ))}
                    </div>

                    <div className="relative min-h-0 flex-1 overflow-hidden">
                        {activeSourceUrl ? (
                            <ReaderView url={activeSourceUrl} />
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                No source selected
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
