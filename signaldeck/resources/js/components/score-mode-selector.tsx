import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Settings2 } from 'lucide-react';

interface ScoreModeSelectorProps {
    currentMode?: string;
    className?: string;
}

export function ScoreModeSelector({ currentMode = 'analyst', className }: ScoreModeSelectorProps) {
    const handleChange = (value: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set('score_mode', value);

        router.visit(url.toString(), {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Select value={currentMode} onValueChange={handleChange}>
                <SelectTrigger className="h-8 w-[140px] text-xs font-medium border-dashed border-gray-400 bg-transparent">
                    <div className="flex items-center gap-2">
                        <Settings2 className="h-3.5 w-3.5" />
                        <SelectValue />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="analyst">
                        <div className="flex flex-col">
                            <span className="font-medium">Analyst Mode</span>
                            <span className="text-[10px] text-muted-foreground">Balanced & credible</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="hype">
                        <div className="flex flex-col">
                            <span className="font-medium">Hype Mode</span>
                            <span className="text-[10px] text-muted-foreground">Speed & format</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="osint">
                        <div className="flex flex-col">
                            <span className="font-medium">OSINT Mode</span>
                            <span className="text-[10px] text-muted-foreground">Raw sources</span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
