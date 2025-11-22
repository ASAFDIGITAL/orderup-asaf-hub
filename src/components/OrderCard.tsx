import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Printer, Clock, MapPin, Banknote } from "lucide-react";
import { Order } from "@/types/order";

interface OrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
  onPrint: (order: Order) => void;
  onPreview: (order: Order) => void;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}

const OrderCard = ({ order, onViewDetails, onPrint, onPreview, getStatusColor, getStatusLabel }: OrderCardProps) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow" dir="rtl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">הזמנה #{order.id}</h3>
              <Badge className={`${getStatusColor(order.status)} text-white`}>
                {getStatusLabel(order.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDate(order.created_at)} • {formatTime(order.created_at)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">{order.customer_name}</span>
            <span className="text-sm text-muted-foreground" dir="ltr">{order.customer_phone}</span>
          </div>
          
          {order.shipping_method === 'delivery' && order.customer_address && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">{order.customer_address}</span>
            </div>
          )}

          {order.shipping_method === 'pickup' && (
            <Badge variant="outline" className="w-fit">
              איסוף עצמי
            </Badge>
          )}
        </div>

        <div className="border-t pt-3 space-y-1">
          <div className="text-sm text-muted-foreground">
            {order.items.length} פריטים
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{order.payment_method === 'cash' ? 'מזומן' : 'אשראי'}</span>
            </div>
            <div className="text-xl font-bold">₪{Number(order.total).toFixed(2)}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => onViewDetails(order)}
          >
            <Eye className="h-4 w-4 mr-2" />
            פרטים
          </Button>
          <Button 
            variant="outline"
            className="flex-1"
            onClick={() => onPreview(order)}
          >
            <Eye className="h-4 w-4 mr-2" />
            תצוגה מקדימה
          </Button>
          <Button 
            variant="default"
            className="flex-1"
            onClick={() => onPrint(order)}
          >
            <Printer className="h-4 w-4 mr-2" />
            הדפס מיידי
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
