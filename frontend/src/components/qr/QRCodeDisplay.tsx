import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QRCodeDisplayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
  qrCode: string;
  description?: string;
}

export function QRCodeDisplay({ 
  open, 
  onOpenChange, 
  memberName, 
  qrCode,
  description 
}: QRCodeDisplayProps) {
  const handleDownload = () => {
    const svg = document.getElementById('member-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${memberName.replace(/\s+/g, '_')}_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Member QR Code</DialogTitle>
        </DialogHeader>
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4 py-4"
        >
          <div className="rounded-xl bg-white p-4 shadow-lg">
            <QRCodeSVG
              id="member-qr-code"
              value={qrCode}
              size={200}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#1a1a2e"
            />
          </div>
          
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">{memberName}</p>
            {description ? (
              <p className="text-sm text-primary font-bold mt-1">{description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{qrCode}</p>
            )}
          </div>
          
          <Button onClick={handleDownload} className="btn-gold">
            <Download className="mr-2 h-4 w-4" />
            Download QR Code
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
