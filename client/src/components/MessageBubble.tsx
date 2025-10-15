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
    <div className={cn("flex gap-2 max-w-[85%] md:max-w-md", isSent ? "ml-auto" : "mr-auto")}>
      <div className={cn("flex flex-col gap-2", isSent ? "items-end" : "items-start")}>
        {!isSent && userName && (
          <span className="label-small text-on-surface-variant px-3">{userName}</span>
        )}
        
        <div
          className={cn(
            "rounded-2xl px-4 py-3 space-y-3 elevation-1",
            isSent
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-surface-container-high text-on-surface rounded-bl-sm"
          )}
          data-testid={`message-bubble-${isSent ? 'sent' : 'received'}`}
        >
          {translatedFrom && (
            <Badge 
              variant="secondary" 
              className="label-small bg-surface-container text-on-surface-variant border-outline-variant"
            >
              Translated from {translatedFrom}
            </Badge>
          )}
          
          <p className="body-large leading-relaxed break-words">{content}</p>
          
          <div className="flex items-center gap-3 justify-between">
            <span className={cn(
              "label-small",
              isSent ? "text-primary-foreground/70" : "text-on-surface-variant"
            )}>
              {timestamp}
            </span>
            
            <div className="flex items-center gap-2">
              {onPlayAudio && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 icon-button",
                    isSent ? "text-primary-foreground" : "text-on-surface"
                  )}
                  onClick={onPlayAudio}
                  data-testid="button-play-audio"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              )}
              
              {isSent && (
                <span className="flex items-center">
                  {status === 'sending' && <Clock className="h-4 w-4 opacity-70" />}
                  {status === 'sent' && <Check className="h-4 w-4 opacity-70" />}
                  {status === 'delivered' && <CheckCheck className="h-4 w-4 opacity-70" />}
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
