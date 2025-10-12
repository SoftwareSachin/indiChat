import { TypingIndicator } from "../TypingIndicator";

export default function TypingIndicatorExample() {
  return (
    <div className="p-4 space-y-4">
      <TypingIndicator />
      <TypingIndicator userName="Priya Sharma" />
    </div>
  );
}
