import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface UserStatusIndicatorProps {
  isOnline: boolean;
  lastSeen?: Date | string;
  className?: string;
}

export function UserStatusIndicator({ isOnline, lastSeen, className }: UserStatusIndicatorProps) {
  const formatLastSeen = (date: Date | string) => {
    const lastSeenDate = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(lastSeenDate, { addSuffix: true });
  };

  return (
    <div className={cn("flex items-center gap-2", className)} data-testid="indicator-user-status">
      <div className={cn(
        "w-2 h-2 rounded-full",
        isOnline ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600"
      )} />
      <span className="text-xs text-muted-foreground">
        {isOnline ? "online" : lastSeen ? `last seen ${formatLastSeen(lastSeen)}` : "offline"}
      </span>
    </div>
  );
}
