import { Volume2, Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type MessageStatus = 'sending' | 'sent' | 'delivered' | 'failed';

interface MessageBubbleProps {
  content: string;
  isSent: boolean;
  timestamp: string;
  status?: MessageStatus;
  translatedFrom?: string;
  originalContent?: string;
  onPlayAudio?: () => void;
  userName?: string;
}

export function MessageBubble({
  content,
  isSent,
  timestamp,
  status = 'delivered',
  translatedFrom,
  originalContent,
  onPlayAudio,
  userName,
}: MessageBubbleProps) {
  return (
    <div className={cn("flex gap-3 max-w-[85%] md:max-w-2xl", isSent ? "ml-auto" : "mr-auto")}>
      <div className={cn("flex flex-col gap-1.5 w-full", isSent ? "items-end" : "items-start")}>
        {!isSent && userName && (
          <span className="text-xs font-medium text-on-surface-variant px-4">{userName}</span>
        )}
        
        <div
          className={cn(
            "rounded-2xl px-4 py-3 space-y-2 shadow-sm",
            isSent
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-surface dark:bg-surface-container text-on-surface dark:text-on-surface rounded-bl-sm border border-outline-variant"
          )}
          data-testid={`message-bubble-${isSent ? 'sent' : 'received'}`}
        >
          {translatedFrom && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] font-normal h-5 px-2",
                isSent 
                  ? "bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20"
                  : "bg-surface-container-high dark:bg-surface-container text-on-surface-variant border-outline-variant"
              )}
            >
              Translated from {translatedFrom}
            </Badge>
          )}
          
          <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{content}</p>
          
          <div className="flex items-center gap-3 justify-between pt-0.5">
            <span className={cn(
              "text-[11px]",
              isSent ? "text-primary-foreground/70" : "text-on-surface-variant"
            )}>
              {timestamp}
            </span>
            
            <div className="flex items-center gap-1.5">
              {onPlayAudio && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPlayAudio}
                  className={cn(
                    "h-7 w-7 rounded-full",
                    isSent 
                      ? "hover:bg-primary-foreground/10 text-primary-foreground/80 hover:text-primary-foreground"
                      : "hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                  )}
                  data-testid="button-play-audio"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </Button>
              )}
              
              {isSent && (
                <span className="flex items-center">
                  {status === 'sending' && <Clock className="h-3.5 w-3.5 text-primary-foreground/70" />}
                  {status === 'sent' && <Check className="h-3.5 w-3.5 text-primary-foreground/70" />}
                  {status === 'delivered' && <CheckCheck className="h-3.5 w-3.5 text-primary-foreground/70" />}
                  {status === 'failed' && <AlertCircle className="h-3.5 w-3.5 text-error" />}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
