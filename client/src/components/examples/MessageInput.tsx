import { MessageInput } from "../MessageInput";
import { useState } from "react";

export default function MessageInputExample() {
  const [recording, setRecording] = useState(false);
  
  return (
    <MessageInput
      onSendMessage={(msg) => console.log('Send message:', msg)}
      onStartVoiceInput={() => {
        console.log('Start recording');
        setRecording(true);
      }}
      onStopVoiceInput={() => {
        console.log('Stop recording');
        setRecording(false);
      }}
      isRecording={recording}
      placeholder="Type a message in your language..."
    />
  );
}
