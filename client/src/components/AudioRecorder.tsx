import { useEffect, useState } from "react";
import { Mic, Square, Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { VoiceWaveform } from "@/components/VoiceWaveform";
import { AudioLevelIndicator } from "@/components/AudioLevelIndicator";

interface AudioRecorderProps {
  isRecording: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onCancel: () => void;
  interimTranscript?: string;
  language?: string;
  audioLevel?: number;
}

export function AudioRecorder({
  isRecording,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
  onCancel,
  interimTranscript,
  language = "English",
  audioLevel = 0
}: AudioRecorderProps) {
  const [showLowVolumeWarning, setShowLowVolumeWarning] = useState(false);

  useEffect(() => {
    if (isRecording && !isPaused) {
      // Show warning if audio level is too low for more than 2 seconds
      const timeout = setTimeout(() => {
        if (audioLevel < 20) {
          setShowLowVolumeWarning(true);
        } else {
          setShowLowVolumeWarning(false);
        }
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [audioLevel, isRecording, isPaused]);
  
  // If not recording, show start button
  if (!isRecording) {
    return (
      <Button
        variant="outline"
        size="lg"
        onClick={onStart}
        data-testid="button-start-recording"
        className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        <Mic className="h-5 w-5" />
        Start Recording
      </Button>
    );
  }

  // If recording, show recording controls
  return (
    <Card className="p-4 border-2 border-primary">
      <div className="space-y-4">
        {/* Waveform visualization */}
        <div className={cn("transition-opacity", isPaused && "opacity-50")}>
          <VoiceWaveform isActive={!isPaused} />
        </div>

        {/* Audio level indicator */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-xs text-muted-foreground">Audio Level:</span>
          <AudioLevelIndicator audioLevel={audioLevel} />
        </div>

        {/* Low volume warning */}
        {showLowVolumeWarning && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2">
            <p className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
              ⚠️ Low audio detected. Please speak louder or move closer to your microphone.
            </p>
          </div>
        )}

        {/* Status text */}
        <div className="text-center">
          <p className="text-sm font-medium text-primary">
            {isPaused ? "Recording Paused" : `Recording in ${language}...`}
          </p>
          {interimTranscript && (
            <p className="text-sm text-muted-foreground mt-1">
              {interimTranscript}
            </p>
          )}
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-2">
          {/* Pause/Resume button */}
          {isPaused ? (
            <Button
              variant="default"
              size="lg"
              onClick={onResume}
              data-testid="button-resume-recording"
              className="gap-2"
            >
              <Play className="h-5 w-5" />
              Resume
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="lg"
              onClick={onPause}
              data-testid="button-pause-recording"
              className="gap-2"
            >
              <Pause className="h-5 w-5" />
              Pause
            </Button>
          )}

          {/* Stop button */}
          <Button
            variant="default"
            size="lg"
            onClick={onStop}
            data-testid="button-stop-recording"
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Square className="h-5 w-5" />
            Stop & Send
          </Button>

          {/* Cancel button */}
          <Button
            variant="destructive"
            size="lg"
            onClick={onCancel}
            data-testid="button-cancel-recording"
            className="gap-2"
          >
            <X className="h-5 w-5" />
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}
