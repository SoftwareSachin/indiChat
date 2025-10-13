import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AudioLevelIndicatorProps {
  audioLevel: number;
  className?: string;
}

export function AudioLevelIndicator({ audioLevel, className }: AudioLevelIndicatorProps) {
  const [bars, setBars] = useState<number[]>([0, 0, 0, 0, 0]);

  useEffect(() => {
    // Convert audio level (0-255) to bar heights
    const normalizedLevel = audioLevel / 255;
    const activeBarCount = Math.floor(normalizedLevel * 5);
    
    const newBars = [0, 1, 2, 3, 4].map(index => {
      if (index < activeBarCount) {
        return 1;
      }
      return 0;
    });
    
    setBars(newBars);
  }, [audioLevel]);

  const getBarColor = (index: number, active: boolean) => {
    if (!active) return "bg-gray-300 dark:bg-gray-700";
    
    if (index >= 4) return "bg-red-500"; // High volume - red
    if (index >= 3) return "bg-yellow-500"; // Medium-high - yellow
    return "bg-green-500"; // Good volume - green
  };

  return (
    <div className={cn("flex items-end gap-1 h-8", className)} data-testid="audio-level-indicator">
      {bars.map((active, index) => (
        <div
          key={index}
          className={cn(
            "w-2 rounded-t transition-all duration-100",
            getBarColor(index, active > 0)
          )}
          style={{
            height: `${20 + index * 15}%`,
            opacity: active > 0 ? 1 : 0.3
          }}
        />
      ))}
    </div>
  );
}
