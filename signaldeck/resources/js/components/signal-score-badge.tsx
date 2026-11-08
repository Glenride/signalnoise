import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ScoreBreakdown } from '@/types';
import { cn } from '@/lib/utils';

interface SignalScoreBadgeProps {
    score: number;
    breakdown?: ScoreBreakdown;
    className?: string;
}

export function SignalScoreBadge({ score, breakdown, className }: SignalScoreBadgeProps) {
    const getScoreColor = (s: number) => {
        if (s >= 80) return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200';
        if (s >= 50) return 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200';
        return 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200';
    };

    const getBarColor = (s: number) => {
        if (s >= 80) return 'bg-red-500';
        if (s >= 50) return 'bg-orange-500';
        return 'bg-gray-400';
    };

    const badge = (
        <Badge
            variant="outline"
            className={cn('cursor-help font-mono transition-colors', getScoreColor(score), className)}
        >
            {score}
        </Badge>
    );

    if (!breakdown) {
        return badge;
    }

    return (
        <TooltipProvider>
            <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>{badge}</TooltipTrigger>
                <TooltipContent className="w-64 p-3 bg-white border border-gray-200 shadow-lg text-gray-900" side="bottom">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b pb-1">
                            <span className="font-semibold text-xs uppercase tracking-wider text-gray-500">Signal Score</span>
                            <span className={cn("font-bold", score >= 80 ? "text-red-600" : score >= 50 ? "text-orange-600" : "text-gray-600")}>
                                {score}
                            </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                            <ScoreRow label="Impact" value={breakdown.impact} weight="30%" color="bg-rose-500" />
                            <ScoreRow label="Velocity" value={breakdown.velocity} weight="20%" color="bg-blue-500" />
                            <ScoreRow label="Credibility" value={breakdown.credibility} weight="20%" color="bg-purple-500" />
                            <ScoreRow label="Novelty" value={breakdown.novelty} weight="15%" color="bg-emerald-500" />
                            <ScoreRow label="Freshness" value={breakdown.freshness} weight="10%" color="bg-amber-500" />
                            <ScoreRow label="Format" value={breakdown.format} weight="5%" color="bg-cyan-500" />
                        </div>

                        {breakdown.reasons && breakdown.reasons.length > 0 && (
                            <div className="pt-2 border-t mt-2">
                                <ul className="text-[10px] space-y-1 text-gray-600 list-disc pl-3">
                                    {breakdown.reasons.slice(0, 3).map((reason, i) => (
                                        <li key={i}>{reason}</li>
                                    ))}
                                    {breakdown.reasons.length > 3 && (
                                        <li className="italic text-gray-400">+{breakdown.reasons.length - 3} more reasons</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function ScoreRow({ label, value, weight, color }: { label: string; value: number; weight: string; color: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-16 flex-shrink-0 text-gray-500">{label}</div>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full", color)}
                    style={{ width: `${value}%` }}
                />
            </div>
            <div className="w-6 text-right font-mono text-gray-700">{value}</div>
        </div>
    );
}
