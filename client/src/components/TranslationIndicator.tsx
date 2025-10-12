import { Languages, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TranslationIndicatorProps {
  isTranslating: boolean;
  className?: string;
}

export function TranslationIndicator({ isTranslating, className }: TranslationIndicatorProps) {
  if (!isTranslating) return null;

  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)} data-testid="indicator-translation">
      <Loader2 className="h-4 w-4 animate-spin" />
      <Languages className="h-4 w-4" />
      <span>Translating message...</span>
    </div>
  );
}
