import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, QrCode as QrIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

interface PublicRegistrationLinkProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublicRegistrationLink({ isOpen, onOpenChange }: PublicRegistrationLinkProps) {
  const [copied, setCopied] = useState(false);
  
  const registrationUrl = `${window.location.origin}/register`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      toast.success('Link Copied', {
        description: 'Registration link copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-[2rem] overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
          <DialogTitle className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Registration Link
          </DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Let members register on their phones
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 flex flex-col items-center gap-8">
          <div className="p-6 bg-white rounded-3xl border-2 border-dashed border-slate-100 shadow-inner flex items-center justify-center">
            <QRCodeSVG 
              value={registrationUrl} 
              size={180}
              level="H"
              includeMargin={true}
              className="rounded-xl"
            />
          </div>

          <div className="w-full space-y-4">
            <div className="flex flex-col gap-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Registration URL</label>
               <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={registrationUrl} 
                  className="h-12 rounded-xl bg-slate-50 border-none font-medium text-slate-600"
                />
                <Button 
                  size="icon" 
                  onClick={copyToClipboard}
                  className="h-12 w-12 shrink-0 rounded-xl bg-primary text-white shadow-lg active:scale-95 transition-transform"
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </Button>
               </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center font-medium px-4 leading-relaxed uppercase tracking-tighter">
              Members can scan the QR code or click the link to fill the form. 
              Submissions will reflect instantly in the members directory.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
