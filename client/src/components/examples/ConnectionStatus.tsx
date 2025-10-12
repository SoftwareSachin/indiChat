import { ConnectionStatus } from "../ConnectionStatus";

export default function ConnectionStatusExample() {
  return (
    <div className="flex gap-2 p-4">
      <ConnectionStatus status="connected" />
      <ConnectionStatus status="connecting" />
      <ConnectionStatus status="disconnected" />
    </div>
  );
}
