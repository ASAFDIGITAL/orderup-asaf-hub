import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Bluetooth, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { thermalPrinter } from '@/services/thermalPrinter';

interface PrinterDevice {
  name: string;
  address: string;
}

interface PrinterSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}

export default function PrinterSelectionDialog({
  open,
  onOpenChange,
  onConnected,
}: PrinterSelectionDialogProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    setPrinters([]);
    
    try {
      toast.loading('מחפש מדפסות...', { id: 'scan' });
      await thermalPrinter.initialize();
      const devices = await thermalPrinter.scanForPrinters();
      
      setPrinters(devices);
      toast.success(`נמצאו ${devices.length} מדפסות`, { id: 'scan' });
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('לא נמצאו מדפסות. ודא שהמדפסת דלוקה וקרובה.', { id: 'scan' });
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnect = async (address: string, name: string) => {
    setIsConnecting(true);
    
    try {
      toast.loading(`מתחבר ל-${name}...`, { id: 'connect' });
      await thermalPrinter.connectToPrinter(address);
      
      toast.success(`מחובר ל-${name}`, { id: 'connect' });
      onConnected();
      onOpenChange(false);
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('כישלון בהתחברות למדפסת', { id: 'connect' });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bluetooth className="h-5 w-5" />
            בחירת מדפסת
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Button
            onClick={handleScan}
            disabled={isScanning}
            className="w-full"
            variant="outline"
          >
            {isScanning ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                מחפש מדפסות...
              </>
            ) : (
              <>
                <Bluetooth className="ml-2 h-4 w-4" />
                סרוק מדפסות
              </>
            )}
          </Button>

          {printers.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                נמצאו {printers.length} מדפסות:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {printers.map((printer) => (
                  <Button
                    key={printer.address}
                    onClick={() => handleConnect(printer.address, printer.name)}
                    disabled={isConnecting}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Printer className="ml-2 h-4 w-4" />
                    <div className="flex-1 text-right">
                      <div className="font-medium">{printer.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {printer.address}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {!isScanning && printers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bluetooth className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">לחץ על 'סרוק מדפסות' למציאת מדפסות זמינות</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
