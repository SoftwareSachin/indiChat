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
    <div className={cn("flex gap-3 max-w-[90%] md:max-w-2xl", isSent ? "ml-auto" : "mr-auto")}>
      <div className={cn("flex flex-col gap-1.5 w-full", isSent ? "items-end" : "items-start")}>
        {!isSent && userName && (
          <span className="label-medium text-on-surface-variant px-4">{userName}</span>
        )}
        
        <div
          className={cn(
            "rounded-3xl px-5 py-3.5 space-y-2.5",
            isSent
              ? "bg-primary text-primary-foreground rounded-br-md shadow-md"
              : "bg-surface text-on-surface dark:bg-surface dark:text-on-surface rounded-bl-md border border-outline-variant"
          )}
          data-testid={`message-bubble-${isSent ? 'sent' : 'received'}`}
        >
          {translatedFrom && (
            <Badge 
              variant="secondary" 
              className={cn(
                "label-small border",
                isSent 
                  ? "bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20"
                  : "bg-surface-container text-on-surface-variant border-outline-variant"
              )}
            >
              Translated from {translatedFrom}
            </Badge>
          )}
          
          <p className="body-large leading-relaxed break-words whitespace-pre-wrap">{content}</p>
          
          <div className="flex items-center gap-3 justify-between pt-1">
            <span className={cn(
              "label-small",
              isSent ? "text-primary-foreground/80" : "text-on-surface-variant"
            )}>
              {timestamp}
            </span>
            
            <div className="flex items-center gap-1.5">
              {onPlayAudio && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                    isSent ? "text-primary-foreground hover:text-primary-foreground" : "text-on-surface hover:text-on-surface"
                  )}
                  onClick={onPlayAudio}
                  data-testid="button-play-audio"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              )}
              
              {isSent && (
                <span className="flex items-center text-primary-foreground/80">
                  {status === 'sending' && <Clock className="h-4 w-4" />}
                  {status === 'sent' && <Check className="h-4 w-4" />}
                  {status === 'delivered' && <CheckCheck className="h-4 w-4" />}
                  {status === 'failed' && <AlertCircle className="h-4 w-4 text-error" />}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
