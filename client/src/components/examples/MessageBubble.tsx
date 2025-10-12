import { MessageBubble } from "../MessageBubble";

export default function MessageBubbleExample() {
  return (
    <div className="space-y-4 p-4">
      <MessageBubble
        content="Hello! How are you?"
        isSent={true}
        timestamp="10:30 AM"
        status="delivered"
      />
      
      <MessageBubble
        content="नमस्ते! मैं ठीक हूं, धन्यवाद।"
        isSent={false}
        timestamp="10:31 AM"
        translatedFrom="Hindi"
        userName="Priya Sharma"
        onPlayAudio={() => console.log('Play audio clicked')}
      />
    </div>
  );
}
