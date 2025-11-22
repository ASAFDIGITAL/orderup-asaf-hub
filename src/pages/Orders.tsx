import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, RefreshCw, Printer, Bell, BellOff, Bluetooth, Search, Filter, X, Bug, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Order } from "@/types/order";
import OrderCard from "@/components/OrderCard";
import OrderDetailsDialog from "@/components/OrderDetailsDialog";
import PrinterSelectionDialog from "@/components/PrinterSelectionDialog";
import RestaurantSettingsDialog from "@/components/RestaurantSettingsDialog";
import { MobileNav } from "@/components/MobileNav";
import { thermalPrinter } from "@/services/thermalPrinter";

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(() => {
    const saved = localStorage.getItem("auto_print_enabled");
    return saved ? JSON.parse(saved) : true;
  });
  const [lastOrderIds, setLastOrderIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("new");
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  const [isPrinterDialogOpen, setIsPrinterDialogOpen] = useState(false);
  const [isRestaurantSettingsOpen, setIsRestaurantSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState({
    minAmount: "",
    maxAmount: "",
    startDate: "",
    endDate: "",
  });
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  const token = localStorage.getItem("pos_token");
  const apiUrl = localStorage.getItem("pos_api_url");

  useEffect(() => {
    if (!token || !apiUrl) {
      navigate("/");
      return;
    }

    // אתחול המדפסת (ניסיון להתחבר למדפסת שמורה)
    thermalPrinter.initialize().then(() => {
      if (thermalPrinter.isConnected()) {
        setIsPrinterConnected(true);
        toast.success("התחבר למדפסת השמורה");
      }
    }).catch(() => {
      // לא עושים כלום אם לא הצלחנו להתחבר
    });

    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // כל 10 שניות

    return () => clearInterval(interval);
  }, [token, apiUrl, navigate]);

  const fetchOrders = async () => {
    if (!token || !apiUrl) return;

    const startTime = performance.now();
    
    try {
      const url = `${apiUrl}/api/pos/orders`;
      console.log("=== 📡 NETWORK REQUEST START ===");
      console.log("🔍 Fetching orders from:", url);
      console.log("🔑 Using token:", token.substring(0, 20) + "...");
      console.log("⏰ Request timestamp:", new Date().toISOString());
      console.log("🌐 Origin:", window.location.origin);
      console.log("📱 User Agent:", navigator.userAgent);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      
      console.log("=== 📡 NETWORK RESPONSE ===");
      console.log("📥 Response status:", response.status);
      console.log("📥 Response statusText:", response.statusText);
      console.log("⏱️ Response time:", duration, "ms");
      console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        console.log("❌ ERROR RESPONSE - Content-Type:", contentType);
        let errorBody;
        
        if (contentType?.includes("application/json")) {
          errorBody = await response.json();
          console.log("❌ Error response (JSON):", JSON.stringify(errorBody, null, 2));
        } else {
          errorBody = await response.text();
          console.log("❌ Error response (Text):", errorBody.substring(0, 1000));
        }
        
        console.log("❌ Full error context:", {
          status: response.status,
          statusText: response.statusText,
          url: url,
          headers: Object.fromEntries(response.headers.entries()),
        });

        if (response.status === 401) {
          console.log("🔐 Unauthorized - logging out");
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
      console.log("✅ SUCCESS - Orders received");
      console.log("📦 Response data:", JSON.stringify(data, null, 2));
      console.log("📊 Orders count:", data.orders?.length || 0);

      if (data.success && Array.isArray(data.orders)) {
        const newOrders = data.orders;
        
        // בדיקה אם יש הזמנות חדשות
        const currentNewOrders = newOrders.filter((o: Order) => o.status === 'new');
        const newOrderIds = currentNewOrders.map((o: Order) => o.id);
        
        // מציאת הזמנות שלא היו בפעם הקודמת
        const brandNewOrders = currentNewOrders.filter((o: Order) => !lastOrderIds.includes(o.id));
        
        if (brandNewOrders.length > 0) {
          // התראה קולית
          if (soundEnabled) {
            playNotificationSound();
            toast.success(`הזמנה חדשה התקבלה! #${brandNewOrders[0]?.id}`);
          }
          
          // הדפסה אוטומטית
          if (autoPrintEnabled && isPrinterConnected) {
            brandNewOrders.forEach(order => {
              handlePrintOrder(order);
            });
          }
        }
        
        setLastOrderIds(newOrderIds);
        setOrders(newOrders);
      }
    } catch (error) {
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      
      console.log("=== ❌ NETWORK ERROR ===");
      console.error("❌ Error fetching orders:", error);
      console.error("⏱️ Failed after:", duration, "ms");
      console.error("🔍 Error type:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("📝 Error message:", error instanceof Error ? error.message : String(error));
      console.error("📚 Error stack:", error instanceof Error ? error.stack : "No stack trace");
      console.error("🌐 Network state:", navigator.onLine ? "Online" : "Offline");
      
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

  const handleConnectPrinter = () => {
    setIsPrinterDialogOpen(true);
  };

  const handlePrinterConnected = () => {
    setIsPrinterConnected(true);
  };

  const handleDisconnectPrinter = async () => {
    try {
      await thermalPrinter.disconnect();
      setIsPrinterConnected(false);
      toast.success("המדפסת נותקה");
    } catch (error) {
      toast.error("שגיאה בניתוק המדפסת");
    }
  };

  const handlePrintOrder = async (order: Order) => {
    try {
      if (!isPrinterConnected) {
        toast.error("יש להתחבר למדפסת תחילה");
        return;
      }

      toast.loading(`מדפיס הזמנה #${order.id}...`, { id: `print-${order.id}` });
      await thermalPrinter.printReceipt(order);
      
      toast.success(`הזמנה #${order.id} הודפסה בהצלחה`, { id: `print-${order.id}` });
    } catch (error) {
      console.error("Print error:", error);
      toast.error(`שגיאה בהדפסה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`, { id: `print-${order.id}` });
    }
  };

  const filterOrders = (status: string) => {
    let filtered = status === "all" ? orders : orders.filter((order) => order.status === status);
    
    // חיפוש טקסט
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        const matchesId = order.id.toString().includes(query);
        const matchesCustomer = order.customer_name?.toLowerCase().includes(query);
        const matchesPhone = order.customer_phone?.includes(query);
        const matchesAmount = order.total.toString().includes(query);
        return matchesId || matchesCustomer || matchesPhone || matchesAmount;
      });
    }
    
    // סינון מתקדם
    if (advancedFilters.minAmount) {
      filtered = filtered.filter((order) => order.total >= parseFloat(advancedFilters.minAmount));
    }
    if (advancedFilters.maxAmount) {
      filtered = filtered.filter((order) => order.total <= parseFloat(advancedFilters.maxAmount));
    }
    if (advancedFilters.startDate) {
      filtered = filtered.filter((order) => new Date(order.created_at) >= new Date(advancedFilters.startDate));
    }
    if (advancedFilters.endDate) {
      filtered = filtered.filter((order) => new Date(order.created_at) <= new Date(advancedFilters.endDate + "T23:59:59"));
    }
    
    return filtered;
  };
  
  const clearFilters = () => {
    setSearchQuery("");
    setAdvancedFilters({
      minAmount: "",
      maxAmount: "",
      startDate: "",
      endDate: "",
    });
  };
  
  const hasActiveFilters = searchQuery || advancedFilters.minAmount || advancedFilters.maxAmount || 
                           advancedFilters.startDate || advancedFilters.endDate;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-500";
      case "pending_payment": return "bg-orange-500";
      case "paid": return "bg-green-500";
      case "preparing": return "bg-yellow-500";
      case "out_for_delivery": return "bg-purple-500";
      case "completed": return "bg-gray-500";
      case "canceled": return "bg-red-500";
      case "failed": return "bg-red-600";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new": return "חדש";
      case "pending_payment": return "ממתין לתשלום";
      case "paid": return "שולם";
      case "preparing": return "בהכנה";
      case "out_for_delivery": return "בדרך";
      case "completed": return "הושלם";
      case "canceled": return "בוטל";
      case "failed": return "נכשל";
      default: return status;
    }
  };

  const newOrders = filterOrders("new");
  const preparingOrders = filterOrders("preparing");
  const completedOrders = filterOrders("completed");
  const allOrders = filterOrders("all");
  
  // חישוב סטטיסטיקות כלליות
  const stats = {
    total: allOrders.length,
    new: allOrders.filter(o => o.status === 'new').length,
    preparing: allOrders.filter(o => o.status === 'preparing').length,
    completed: allOrders.filter(o => o.status === 'completed').length,
    canceled: allOrders.filter(o => o.status === 'canceled').length,
    pending_payment: allOrders.filter(o => o.status === 'pending_payment').length,
  };
  
  // חישוב הזמנות היום בלבד
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((order) => {
    const orderDate = new Date(order.created_at);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });
  
  const todayStats = {
    total: todayOrders.length,
    completed: todayOrders.filter(o => o.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold">ASAF POS</h1>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {localStorage.getItem("device_name")}
              </span>
              <Badge variant="outline" className="bg-primary/10">
                היום: {todayStats.total} הזמנות • הושלמו: {todayStats.completed}
              </Badge>
            </div>
            <div className="flex gap-1 sm:gap-2 flex-wrap justify-end sm:justify-start">
              {/* כפתורים למחשב */}
              <div className="hidden md:flex gap-2">
                <Button
                  variant={isPrinterConnected ? "default" : "outline"}
                  size="icon"
                  onClick={isPrinterConnected ? handleDisconnectPrinter : handleConnectPrinter}
                  title={isPrinterConnected ? "נתק מדפסת" : "התחבר למדפסת"}
                >
                  <Bluetooth className={`h-4 w-4 ${isPrinterConnected ? "text-white" : ""}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? "כבה התראות" : "הפעל התראות"}
                >
                  {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newValue = !autoPrintEnabled;
                    setAutoPrintEnabled(newValue);
                    localStorage.setItem("auto_print_enabled", JSON.stringify(newValue));
                    toast.success(newValue ? "הדפסה אוטומטית הופעלה" : "הדפסה אוטומטית כובתה");
                  }}
                  title={autoPrintEnabled ? "כבה הדפסה אוטומטית" : "הפעל הדפסה אוטומטית"}
                >
                  <Printer className={`h-4 w-4 ${autoPrintEnabled ? "text-green-500" : ""}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navigate("/debug")}
                  title="מסך דיבוג"
                >
                  <Bug className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsRestaurantSettingsOpen(true)}
                  title="הגדרות מסעדה"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  יציאה
                </Button>
              </div>
              
              {/* תפריט המבורגר למובייל */}
              <MobileNav
                isPrinterConnected={isPrinterConnected}
                soundEnabled={soundEnabled}
                autoPrintEnabled={autoPrintEnabled}
                isRefreshing={isRefreshing}
                onConnectPrinter={handleConnectPrinter}
                onDisconnectPrinter={handleDisconnectPrinter}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
                onToggleAutoPrint={() => {
                  const newValue = !autoPrintEnabled;
                  setAutoPrintEnabled(newValue);
                  localStorage.setItem("auto_print_enabled", JSON.stringify(newValue));
                  toast.success(newValue ? "הדפסה אוטומטית הופעלה" : "הדפסה אוטומטית כובתה");
                }}
                onRefresh={handleRefresh}
                onOpenDebug={() => navigate("/debug")}
                onOpenSettings={() => setIsRestaurantSettingsOpen(true)}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="container mx-auto px-2 sm:px-4 py-2 border-t">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="חיפוש לפי מספר הזמנה, לקוח, טלפון או סכום..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
            
            <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className={hasActiveFilters ? "border-primary" : ""}
                >
                  <Filter className={`h-4 w-4 ${hasActiveFilters ? "text-primary" : ""}`} />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>סינון מתקדם</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>טווח סכום</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="מינימום"
                        value={advancedFilters.minAmount}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder="מקסימום"
                        value={advancedFilters.maxAmount}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>טווח תאריכים</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">מתאריך</Label>
                        <Input
                          type="date"
                          value={advancedFilters.startDate}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">עד תאריך</Label>
                        <Input
                          type="date"
                          value={advancedFilters.endDate}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={clearFilters}
                    >
                      נקה סינון
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => setIsFilterDialogOpen(false)}
                    >
                      החל
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={clearFilters}
                title="נקה את כל הפילטרים"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
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
            <TabsTrigger value="completed" className="relative">
              הושלמו
              {completedOrders.length > 0 && (
                <Badge className="mr-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-green-500">
                  {completedOrders.length}
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

          <TabsContent value="completed" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedOrders.map((order) => (
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
            {completedOrders.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">אין הזמנות שהושלמו</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {/* סטטיסטיקות */}
            <Card className="p-4 mb-6" dir="rtl">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">סה"כ</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{stats.new}</div>
                  <div className="text-sm text-muted-foreground">חדשות</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{stats.pending_payment}</div>
                  <div className="text-sm text-muted-foreground">ממתינות</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{stats.preparing}</div>
                  <div className="text-sm text-muted-foreground">בהכנה</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
                  <div className="text-sm text-muted-foreground">הושלמו</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{stats.canceled}</div>
                  <div className="text-sm text-muted-foreground">בוטלו</div>
                </div>
              </div>
            </Card>
            
            {/* רשימת הזמנות */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allOrders.map((order) => (
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
            {allOrders.length === 0 && (
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

      {/* Printer Selection Dialog */}
      <PrinterSelectionDialog
        open={isPrinterDialogOpen}
        onOpenChange={setIsPrinterDialogOpen}
        onConnected={handlePrinterConnected}
      />

      {/* Restaurant Settings Dialog */}
      <RestaurantSettingsDialog
        open={isRestaurantSettingsOpen}
        onOpenChange={setIsRestaurantSettingsOpen}
      />
    </div>
  );
};

export default Orders;
