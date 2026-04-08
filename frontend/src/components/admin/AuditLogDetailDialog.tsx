import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowRight, History, Info } from "lucide-react";
import { AuditLog } from "@/hooks/useAuditLogs";
import { format, parseISO } from "date-fns";

interface AuditLogDetailDialogProps {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DiffValue {
  old?: string | number | null;
  new?: string | number | null;
}

export function AuditLogDetailDialog({ log, open, onOpenChange }: AuditLogDetailDialogProps) {
  if (!log) return null;

  const details = log.details || {};
  const isUpdate = log.action === "update";
  
  // Extracting changes if they follow a common pattern (e.g., { field: { old: v1, new: v2 } })
  const renderDetails = () => {
    if (Object.keys(details).length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground italic">
          <Info className="h-10 w-10 mb-2 opacity-20" />
          No additional metadata recorded for this action.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {Object.entries(details).map(([key, value]) => {
          // Check if it's a "diff" object
          const isDiff = value && typeof value === 'object' && ('old' in value || 'new' in value);
          
          return (
            <div key={key} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{key.replace(/_/g, ' ')}</span>
                {isDiff && <Badge variant="outline" className="text-[8px] font-black uppercase text-blue-500 bg-blue-50 border-none">Changed</Badge>}
              </div>
              
              {isDiff ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 p-2 rounded bg-rose-50/50 border border-rose-100/50 text-xs text-rose-700 line-through truncate">
                    {String((value as DiffValue).old || 'None')}
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                  <div className="flex-1 p-2 rounded bg-emerald-50/50 border border-emerald-100/50 text-xs text-emerald-700 font-bold truncate">
                    {String((value as DiffValue).new || 'None')}
                  </div>
                </div>
              ) : (
                <div className="p-2 rounded bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium whitespace-pre-wrap break-words">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="h-2 w-full bg-primary" />
        
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <History className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Audit Detail Insight</DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500">
                Deep dive into administrative event <code className="bg-slate-100 px-1 rounded">#{log.id.slice(0, 8)}</code>
              </DialogDescription>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 my-6">
             <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Administrator</p>
                <p className="text-sm font-bold text-slate-900">{log.user_name}</p>
             </div>
             <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Timestamp</p>
                <p className="text-sm font-bold text-slate-900">
                    {format(parseISO(log.timestamp), 'MMM d, yyyy · HH:mm:ss')}
                </p>
             </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] px-6 pb-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-slate-300" />
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata & Value Reflections</h4>
          </div>
          
          {renderDetails()}
        </ScrollArea>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
           <Badge variant="outline" className="bg-white text-[9px] font-black border-slate-200">INTERNAL LOG RECORD</Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}
