import { cn } from "@/lib/utils";

interface VoiceWaveformProps {
  isActive: boolean;
  className?: string;
}

export function VoiceWaveform({ isActive, className }: VoiceWaveformProps) {
  return (
    <div className={cn("flex items-center justify-center gap-1 h-12", className)} data-testid="waveform-voice">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-primary rounded-full transition-all",
            isActive && "animate-pulse"
          )}
          style={{
            height: isActive ? `${20 + Math.random() * 20}px` : '8px',
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  );
}
