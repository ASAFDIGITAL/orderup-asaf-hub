import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, RefreshCw, Printer, Bell, BellOff } from "lucide-react";
import { Order } from "@/types/order";
import OrderCard from "@/components/OrderCard";
import OrderDetailsDialog from "@/components/OrderDetailsDialog";

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [activeTab, setActiveTab] = useState("new");

  const token = localStorage.getItem("pos_token");
  const apiUrl = localStorage.getItem("pos_api_url");

  useEffect(() => {
    if (!token || !apiUrl) {
      navigate("/");
      return;
    }

    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // כל 10 שניות

    return () => clearInterval(interval);
  }, [token, apiUrl, navigate]);

  const fetchOrders = async () => {
    if (!token || !apiUrl) return;

    try {
      const url = `${apiUrl}/api/pos/orders`;
      console.log("🔍 Fetching orders from:", url);
      console.log("🔑 Using token:", token.substring(0, 20) + "...");

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      console.log("📥 Response status:", response.status);
      console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorBody;
        
        if (contentType?.includes("application/json")) {
          errorBody = await response.json();
          console.log("❌ Error response (JSON):", errorBody);
        } else {
          errorBody = await response.text();
          console.log("❌ Error response (HTML/Text):", errorBody.substring(0, 500));
        }

        if (response.status === 401) {
          toast.error("הטוקן לא תקין. מתנתק...");
          handleLogout();
          return;
        }
        
        toast.error(`שגיאה ${response.status}: ${errorBody.message || "לא ניתן לטעון הזמנות"}`);
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        const text = await response.text();
        console.log("⚠️ Non-JSON response:", text.substring(0, 500));
        toast.error("השרת החזיר תשובה לא תקינה (לא JSON)");
        return;
      }

      const data = await response.json();
      console.log("✅ Orders received:", data);
      
      if (data.success && Array.isArray(data.orders)) {
        const newOrders = data.orders;
        
        // בדיקה אם יש הזמנות חדשות
        const newOrdersCount = newOrders.filter((o: Order) => o.status === 'new').length;
        if (soundEnabled && newOrdersCount > lastOrderCount) {
          playNotificationSound();
          toast.success(`הזמנה חדשה התקבלה! #${newOrders[0]?.id}`);
        }
        
        setLastOrderCount(newOrdersCount);
        setOrders(newOrders);
      }
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        toast.error("לא ניתן להתחבר לשרת. בדוק CORS או כתובת API");
      } else {
        toast.error("שגיאה בטעינת הזמנות");
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
    toast.success("רשימת ההזמנות עודכנה");
  };

  const playNotificationSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.play().catch(() => {
      // אם אין קובץ, נשתמש בצליל ברירת מחדל
      const beep = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKrj8LVkHAU7k9jyzn0zBSGAy/LdjUcHHGu98eeYUhkOTKHh8bllHgU7k9jyzn0zBSGAy/LdjUcHHGu98eeYUhkOTKHh8bllHgU7k9jyzn0zBSGAy/LdjUcHHGu98eeYUhkOTKHh8bllHgU7k9jyzn0zBSGAy/LdjUcHHGu98eeYUhkOTKHh8bllHgU7k9jyzn0zBSGAy/LdjUcHHGu98eeYUhkOTKHh8bllHgU7k9jyzn0zBSGAy/LdjUcHHGu98eeYUhkOTKHh8bllHg==");
      beep.play().catch(() => {});
    });

    // ויברציה
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("pos_token");
    localStorage.removeItem("pos_api_url");
    localStorage.removeItem("device_name");
    navigate("/");
  };

  const handlePrintOrder = async (order: Order) => {
    try {
      // כאן תהיה אינטגרציה עם מדפסת תרמית
      toast.success(`מדפיס הזמנה #${order.id}`);
      // בשלב הבא נוסיף את הקוד להדפסה בפועל
    } catch (error) {
      toast.error("שגיאה בהדפסה");
    }
  };

  const filterOrders = (status: string) => {
    if (status === "all") return orders;
    return orders.filter((order) => order.status === status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-500";
      case "preparing": return "bg-yellow-500";
      case "ready": return "bg-green-500";
      case "completed": return "bg-gray-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new": return "חדש";
      case "preparing": return "בהכנה";
      case "ready": return "מוכן";
      case "completed": return "הושלם";
      case "cancelled": return "בוטל";
      default: return status;
    }
  };

  const newOrders = filterOrders("new");
  const preparingOrders = filterOrders("preparing");
  const readyOrders = filterOrders("ready");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">ASAF POS</h1>
              <p className="text-sm text-muted-foreground">
                {localStorage.getItem("device_name")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 ml-2" />
                יציאה
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="new" className="relative">
              חדש
              {newOrders.length > 0 && (
                <Badge variant="destructive" className="mr-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {newOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preparing" className="relative">
              בהכנה
              {preparingOrders.length > 0 && (
                <Badge className="mr-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-yellow-500">
                  {preparingOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="relative">
              מוכן
              {readyOrders.length > 0 && (
                <Badge className="mr-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-green-500">
                  {readyOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">הכל</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {newOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onViewDetails={setSelectedOrder}
                  onPrint={handlePrintOrder}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                />
              ))}
            </div>
            {newOrders.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">אין הזמנות חדשות</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preparing" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {preparingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onViewDetails={setSelectedOrder}
                  onPrint={handlePrintOrder}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                />
              ))}
            </div>
            {preparingOrders.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">אין הזמנות בהכנה</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ready" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {readyOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onViewDetails={setSelectedOrder}
                  onPrint={handlePrintOrder}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                />
              ))}
            </div>
            {readyOrders.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">אין הזמנות מוכנות</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onViewDetails={setSelectedOrder}
                  onPrint={handlePrintOrder}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                />
              ))}
            </div>
            {orders.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">אין הזמנות</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onPrint={handlePrintOrder}
          onUpdateStatus={fetchOrders}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
        />
      )}
    </div>
  );
};

export default Orders;
