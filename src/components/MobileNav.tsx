import { Bluetooth, Bell, BellOff, Printer, RefreshCw, Bug, Settings, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from './ui/sheet';
import { Separator } from './ui/separator';
import { Menu } from 'lucide-react';

interface MobileNavProps {
  isPrinterConnected: boolean;
  soundEnabled: boolean;
  autoPrintEnabled: boolean;
  isRefreshing: boolean;
  onConnectPrinter: () => void;
  onDisconnectPrinter: () => void;
  onToggleSound: () => void;
  onToggleAutoPrint: () => void;
  onRefresh: () => void;
  onOpenDebug: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export function MobileNav({
  isPrinterConnected,
  soundEnabled,
  autoPrintEnabled,
  isRefreshing,
  onConnectPrinter,
  onDisconnectPrinter,
  onToggleSound,
  onToggleAutoPrint,
  onRefresh,
  onOpenDebug,
  onOpenSettings,
  onLogout,
}: MobileNavProps) {
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72" dir="rtl">
          <SheetHeader>
            <SheetTitle>תפריט</SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col gap-3 mt-6">
            <Button
              variant={isPrinterConnected ? "default" : "outline"}
              className="w-full justify-start"
              onClick={isPrinterConnected ? onDisconnectPrinter : onConnectPrinter}
            >
              <Bluetooth className="h-4 w-4 ml-2" />
              {isPrinterConnected ? "נתק מדפסת" : "התחבר למדפסת"}
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={onToggleSound}
            >
              {soundEnabled ? <Bell className="h-4 w-4 ml-2" /> : <BellOff className="h-4 w-4 ml-2" />}
              {soundEnabled ? "כבה התראות" : "הפעל התראות"}
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={onToggleAutoPrint}
            >
              <Printer className={`h-4 w-4 ml-2 ${autoPrintEnabled ? "text-green-500" : ""}`} />
              {autoPrintEnabled ? "כבה הדפסה אוטומטית" : "הפעל הדפסה אוטומטית"}
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${isRefreshing ? "animate-spin" : ""}`} />
              רענן הזמנות
            </Button>
            
            <Separator className="my-2" />
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={onOpenDebug}
            >
              <Bug className="h-4 w-4 ml-2" />
              מסך דיבוג
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={onOpenSettings}
            >
              <Settings className="h-4 w-4 ml-2" />
              הגדרות מסעדה
            </Button>
            
            <Separator className="my-2" />
            
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4 ml-2" />
              יציאה
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
