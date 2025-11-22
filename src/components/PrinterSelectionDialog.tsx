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
  const [manualAddress, setManualAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

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

  const handleConnect = async (address: string, name?: string) => {
    setIsConnecting(true);
    
    try {
      toast.loading(`מתחבר${name ? ` ל-${name}` : ''}...`, { id: 'connect' });
      await thermalPrinter.connectToPrinter(address);
      
      toast.success(`מחובר${name ? ` ל-${name}` : ' בהצלחה'}`, { id: 'connect' });
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
          <div className="flex gap-2">
            <Button
              onClick={handleScan}
              disabled={isScanning}
              variant="outline"
              className="flex-1"
            >
              {isScanning ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מחפש...
                </>
              ) : (
                <>
                  <Bluetooth className="ml-2 h-4 w-4" />
                  סרוק
                </>
              )}
            </Button>
            
            <Button
              onClick={() => setShowManualInput(!showManualInput)}
              variant="outline"
              className="flex-1"
            >
              חיבור ידני
            </Button>
          </div>

          {showManualInput && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <label className="text-sm font-medium block">
                כתובת MAC של המדפסת:
              </label>
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="00:AA:11:BB:22:CC"
                className="w-full px-3 py-2 border rounded-md bg-background text-center font-mono"
                dir="ltr"
              />
              <Button
                onClick={() => handleConnect(manualAddress)}
                disabled={isConnecting || !manualAddress}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    מתחבר...
                  </>
                ) : (
                  'התחבר למדפסת'
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                לדוגמה: 00:AA:11:BB:22:CC
              </p>
            </div>
          )}

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
                      <div className="text-xs text-muted-foreground font-mono">
                        {printer.address}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {!isScanning && printers.length === 0 && !showManualInput && (
            <div className="text-center py-8 text-muted-foreground">
              <Bluetooth className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">לחץ על 'סרוק' או 'חיבור ידני'</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
