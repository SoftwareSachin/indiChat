import { cn } from "@/lib/utils";
import { Mic } from "lucide-react";

interface RecordingIndicatorProps {
  userName: string;
  className?: string;
}

export function RecordingIndicator({ userName, className }: RecordingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 px-4 py-2", className)} data-testid="indicator-recording">
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <Mic className="h-4 w-4 text-destructive" />
          <div className="absolute inset-0 animate-ping">
            <Mic className="h-4 w-4 text-destructive opacity-75" />
          </div>
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-3 bg-destructive rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-3 bg-destructive rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
          <div className="w-1 h-3 bg-destructive rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
        </div>
      </div>
      <span className="text-sm text-muted-foreground">{userName} is recording audio</span>
    </div>
  );
}
