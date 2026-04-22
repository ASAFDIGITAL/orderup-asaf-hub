import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Printer } from "lucide-react";
import { RestaurantSettings, defaultRestaurantSettings } from "@/types/restaurant";
import { toast } from "sonner";
import { thermalPrinter } from "@/services/thermalPrinter";

interface RestaurantSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RestaurantSettingsDialog = ({ open, onOpenChange }: RestaurantSettingsDialogProps) => {
  const [settings, setSettings] = useState<RestaurantSettings>(defaultRestaurantSettings);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (open) {
      // טעינת הגדרות קיימות
      const stored = localStorage.getItem("restaurant_settings");
      if (stored) {
        setSettings({ ...defaultRestaurantSettings, ...JSON.parse(stored) });
      } else {
        setSettings(defaultRestaurantSettings);
      }
    }
  }, [open]);

  const handleSave = () => {
    thermalPrinter.saveRestaurantSettings(settings);
    toast.success("ההגדרות נשמרו בהצלחה");
    onOpenChange(false);
  };

  const handleTestPrint = async () => {
    // שמור הגדרות לפני בדיקה
    thermalPrinter.saveRestaurantSettings(settings);
    setIsTesting(true);
    try {
      toast.loading("שולח הדפסת בדיקה...", { id: "test-print" });
      await thermalPrinter.testServerPrint();
      toast.success("הדפסת בדיקה נשלחה בהצלחה!", { id: "test-print" });
    } catch (error: any) {
      console.error("Test print failed:", error);
      toast.error(error?.message || "כישלון בהדפסת בדיקה", { id: "test-print" });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>הגדרות מסעדה להדפסה</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם המסעדה (עברית)</Label>
            <Input
              id="name"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              placeholder="שם המסעדה"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameAr">שם המסעדה (ערבית)</Label>
            <Input
              id="nameAr"
              value={settings.nameAr || ""}
              onChange={(e) => setSettings({ ...settings, nameAr: e.target.value })}
              placeholder="اسم المطعم"
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">כתובת</Label>
            <Input
              id="address"
              value={settings.address || ""}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              placeholder="כתובת המסעדה"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">טלפון</Label>
            <Input
              id="phone"
              value={settings.phone || ""}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              placeholder="מספר טלפון"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer">הודעת סיום (עברית)</Label>
            <Textarea
              id="footer"
              value={settings.footer || ""}
              onChange={(e) => setSettings({ ...settings, footer: e.target.value })}
              placeholder="תודה רבה!"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footerAr">הודעת סיום (ערבית)</Label>
            <Textarea
              id="footerAr"
              value={settings.footerAr || ""}
              onChange={(e) => setSettings({ ...settings, footerAr: e.target.value })}
              placeholder="شكراً جزيلاً!"
              rows={2}
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fontSize">גודל פונט בהדפסה</Label>
            <Select
              value={settings.fontSize || 'medium'}
              onValueChange={(value: 'normal' | 'medium' | 'large') => 
                setSettings({ ...settings, fontSize: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר גודל פונט" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">רגיל</SelectItem>
                <SelectItem value="medium">בינוני (x2)</SelectItem>
                <SelectItem value="large">גדול (x3)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="my-2" />

          {/* הדפסה דרך הדפדפן - הכי פשוט */}
          <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="browserPrint" className="text-base font-semibold">
                  הדפסה מהדפדפן 🖨️
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  פותח חלון הדפסה ושולח ישירות למדפסת המוגדרת במחשב (הכי פשוט!)
                </p>
              </div>
              <Switch
                id="browserPrint"
                checked={settings.browserPrintEnabled || false}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, browserPrintEnabled: checked })
                }
              />
            </div>
            {settings.browserPrintEnabled && (
              <p className="text-xs text-muted-foreground bg-background p-2 rounded">
                💡 בדיאלוג ההדפסה של הדפדפן בחר את המדפסת <strong>cash</strong> וגודל נייר <strong>80mm</strong>.
              </p>
            )}
          </div>

          <Separator className="my-2" />

          {/* הדפסה דרך מחשב מרוחק */}
          <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="networkPrint" className="text-base font-semibold">
                  הדפסה דרך מחשב (Network)
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  שלח הדפסות למדפסת המחוברת למחשב דרך השרת
                </p>
              </div>
              <Switch
                id="networkPrint"
                checked={settings.networkPrintEnabled || false}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, networkPrintEnabled: checked })
                }
              />
            </div>

            {settings.networkPrintEnabled && (
              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="networkPrintUrl">כתובת שרת ההדפסה</Label>
                  <Input
                    id="networkPrintUrl"
                    value={settings.networkPrintUrl || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, networkPrintUrl: e.target.value })
                    }
                    placeholder="https://your-server.com/api/print"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="networkPrinterName">שם המדפסת המשותפת</Label>
                  <Input
                    id="networkPrinterName"
                    value={settings.networkPrinterName || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, networkPrinterName: e.target.value })
                    }
                    placeholder="ThermalPrinter"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    שם המדפסת ששיתפת ב-Windows
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleTestPrint}
                  disabled={
                    isTesting ||
                    !settings.networkPrintUrl ||
                    !settings.networkPrinterName
                  }
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      שולח...
                    </>
                  ) : (
                    <>
                      <Printer className="ml-2 h-4 w-4" />
                      הדפסת בדיקה
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              שמור
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RestaurantSettingsDialog;
