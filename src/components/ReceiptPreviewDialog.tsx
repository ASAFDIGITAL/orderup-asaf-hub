import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Order } from '@/types/order';
import { thermalPrinter } from '@/services/thermalPrinter';
import { toast } from 'sonner';

interface ReceiptPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

export function ReceiptPreviewDialog({ open, onOpenChange, order }: ReceiptPreviewDialogProps) {
  const receiptText = thermalPrinter.formatReceiptText(order);

  const handlePrint = async () => {
    try {
      await thermalPrinter.printReceipt(order);
      toast.success('הקבלה הודפסה בהצלחה');
      onOpenChange(false);
    } catch (error) {
      console.error('Print error:', error);
      toast.error('שגיאה בהדפסת הקבלה');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>תצוגה מקדימה - קבלה</DialogTitle>
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-lg max-h-[500px] overflow-y-auto">
          <pre className="text-sm font-mono whitespace-pre-wrap text-right" dir="rtl">
            {receiptText}
          </pre>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handlePrint}>
            הדפס עכשיו
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
