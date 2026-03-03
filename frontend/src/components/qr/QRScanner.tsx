import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (qrCode: string) => void;
}

export function QRScanner({ open, onOpenChange, onScan }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (open && !scannerRef.current) {
      // Small delay to ensure DOM is ready
      const timeout = setTimeout(() => {
        try {
          scannerRef.current = new Html5QrcodeScanner(
            'qr-reader',
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
              rememberLastUsedCamera: true,
            },
            false
          );

          scannerRef.current.render(
            (decodedText) => {
              // Success callback
              onScan(decodedText);
              handleClose();
            },
            (errorMessage) => {
              // Error callback - ignore scanning errors
              console.debug('QR scan error:', errorMessage);
            }
          );
          
          setIsScanning(true);
        } catch (err) {
          console.error('Failed to initialize scanner:', err);
        }
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [open, onScan]);

  const handleClose = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error clearing scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Member QR Code
          </DialogTitle>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative"
        >
          <div id="qr-reader" className="w-full overflow-hidden rounded-lg" />
          
          {!isScanning && (
            <div className="flex h-64 items-center justify-center rounded-lg bg-muted">
              <div className="text-center">
                <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Initializing camera...</p>
              </div>
            </div>
          )}
          
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Point your camera at a member's QR code to mark their attendance
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
