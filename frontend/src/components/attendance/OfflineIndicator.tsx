import { Wifi, WifiOff, Loader2, CloudOff, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOfflineAttendance } from '@/hooks/useOfflineAttendance';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  showSyncButton?: boolean;
}

export function OfflineIndicator({ className, showSyncButton = true }: OfflineIndicatorProps) {
  const { isOnline, pendingCount, isSyncing, syncPendingRecords } = useOfflineAttendance();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {!isOnline ? (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
      ) : isSyncing ? (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Syncing...
        </Badge>
      ) : pendingCount > 0 ? (
        <>
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 gap-1">
            <CloudOff className="h-3 w-3" />
            {pendingCount} pending
          </Badge>
          {showSyncButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => syncPendingRecords()}
              className="h-7 px-2 text-xs"
            >
              Sync Now
            </Button>
          )}
        </>
      ) : (
        <Badge variant="outline" className="bg-secondary/50 text-secondary-foreground border-secondary gap-1">
          <Check className="h-3 w-3" />
          All synced
        </Badge>
      )}
    </div>
  );
}
