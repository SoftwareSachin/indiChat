import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ConnectionState = 'connected' | 'connecting' | 'disconnected';

interface ConnectionStatusProps {
  status: ConnectionState;
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const config = {
    connected: {
      icon: Wifi,
      label: 'Connected',
      variant: 'default' as const,
      className: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
    },
    connecting: {
      icon: RefreshCw,
      label: 'Connecting',
      variant: 'secondary' as const,
      className: 'animate-spin',
    },
    disconnected: {
      icon: WifiOff,
      label: 'Offline',
      variant: 'destructive' as const,
      className: '',
    },
  };

  const { icon: Icon, label, variant, className } = config[status];

  return (
    <Badge variant={variant} className="gap-1.5" data-testid={`status-connection-${status}`}>
      <Icon className={cn("h-3 w-3", className)} />
      <span className="text-xs">{label}</span>
    </Badge>
  );
}
