import { VoiceWaveform } from "../VoiceWaveform";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function VoiceWaveformExample() {
  const [active, setActive] = useState(false);
  
  return (
    <div className="p-4 space-y-4">
      <VoiceWaveform isActive={active} />
      <Button onClick={() => setActive(!active)}>
        {active ? 'Stop' : 'Start'} Recording
      </Button>
    </div>
  );
}
