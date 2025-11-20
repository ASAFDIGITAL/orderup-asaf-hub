import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Printer, X, Clock, MapPin, Phone, User, Banknote } from "lucide-react";
import { Order } from "@/types/order";

interface OrderDetailsDialogProps {
  order: Order;
  open: boolean;
  onClose: () => void;
  onPrint: (order: Order) => void;
  onUpdateStatus: () => void;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}

const OrderDetailsDialog = ({
  order,
  open,
  onClose,
  onPrint,
  onUpdateStatus,
  getStatusColor,
  getStatusLabel,
}: OrderDetailsDialogProps) => {
  const token = localStorage.getItem("pos_token");
  const apiUrl = localStorage.getItem("pos_api_url");

  const handleStatusChange = async (newStatus: string) => {
    if (!token || !apiUrl) return;

    const startTime = performance.now();
    const url = `${apiUrl}/api/pos/orders/${order.id}/status`;

    try {
      console.log("=== 🔄 STATUS UPDATE REQUEST ===");
      console.log("🔍 PUT request to:", url);
      console.log("📦 Request body:", { status: newStatus });
      console.log("⏰ Request timestamp:", new Date().toISOString());

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      console.log("=== 🔄 STATUS UPDATE RESPONSE ===");
      console.log("📥 Response status:", response.status);
      console.log("⏱️ Response time:", duration, "ms");
      console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.log("❌ Failed to update status - status code:", response.status);
        throw new Error("Failed to update status");
      }

      const data = await response.json();
      console.log("✅ SUCCESS - Status updated:", JSON.stringify(data, null, 2));

      if (data.success) {
        toast.success(`סטטוס עודכן ל: ${getStatusLabel(newStatus)}`);
        await onUpdateStatus(); // מחכים לעדכון לפני סגירה
        onClose();
      }
    } catch (error) {
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      console.log("=== ❌ STATUS UPDATE ERROR ===");
      console.error("❌ Error updating status:", error);
      console.error("⏱️ Failed after:", duration, "ms");
      console.error("🔍 Error type:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("📝 Error message:", error instanceof Error ? error.message : String(error));

      toast.error("שגיאה בעדכון סטטוס");
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNextStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'new':
        return [
          { value: 'preparing', label: 'בהכנה', variant: 'default' as const },
          { value: 'canceled', label: 'בטל', variant: 'destructive' as const },
        ];
      case 'preparing':
        return [
          { value: 'completed', label: 'הושלמה', variant: 'default' as const },
          { value: 'canceled', label: 'בטל', variant: 'destructive' as const },
        ];
      case 'out_for_delivery':
        return [
          { value: 'completed', label: 'סמן כהושלם', variant: 'default' as const },
        ];
      default:
        return [];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">הזמנה #{order.id}</DialogTitle>
            <Badge className={`${getStatusColor(order.status)} text-white`}>
              {getStatusLabel(order.status)}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 py-4 text-right">
            {/* פרטי לקוח */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">פרטי לקוח</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span dir="ltr">{order.customer_phone}</span>
                </div>
                {order.customer_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{order.customer_address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  <span>{order.payment_method === 'cash' ? 'מזומן' : 'אשראי'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDateTime(order.created_at)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* פריטים */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">פריטים</h3>
              {order.items.map((item, index) => (
                <div key={index} className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1 text-right">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        כמות: {item.qty} × ₪{Number(item.unit_price).toFixed(2)}
                      </div>
                    </div>
                    <div className="font-bold">₪{Number(item.total).toFixed(2)}</div>
                  </div>

                  {item.options?.choices && item.options.choices.length > 0 && (
                    <div className="text-sm space-y-1 pr-4 border-r-2 border-primary/20 text-right">
                      {item.options.choices.map((group, gIndex) => (
                        <div key={gIndex}>
                          <span className="font-medium">{group.group}: </span>
                          <span className="text-muted-foreground">
                            {group.items.map(i => i.name).join(', ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.options?.note && (
                    <div className="text-sm pr-4 border-r-2 border-accent/40 text-right">
                      <span className="font-medium">הערה: </span>
                      <span className="text-muted-foreground">{item.options.note}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Separator />

            {/* סיכום */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>₪{Number(order.subtotal).toFixed(2)}</span>
                <span>ביניים</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>₪{Number(order.delivery_fee).toFixed(2)}</span>
                <span>משלוח</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>₪{Number(order.total).toFixed(2)}</span>
                <span>סה"כ</span>
              </div>
            </div>

            {order.notes && (
              <>
                <Separator />
                <div className="space-y-2 text-right">
                  <h3 className="font-semibold">הערות</h3>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onPrint(order)}
            className="flex-1"
          >
            <Printer className="h-4 w-4 mr-2" />
            הדפס
          </Button>
          {getNextStatusOptions(order.status).map((option) => (
            <Button
              key={option.value}
              variant={option.variant}
              onClick={() => handleStatusChange(option.value)}
              className="flex-1"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
