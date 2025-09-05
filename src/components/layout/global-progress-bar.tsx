
'use client';
import { useAppContext } from "@/components/app-provider";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function GlobalProgressBar() {
    const { isGlobalLoading } = useAppContext();
    
    return (
        <div className={cn("w-full h-1", {
            'invisible': !isGlobalLoading
        })}>
            <Progress value={100} className="w-full h-1 animate-pulse" />
        </div>
    );
}
