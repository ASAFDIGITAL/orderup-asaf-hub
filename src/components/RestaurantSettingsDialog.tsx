import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RestaurantSettings, defaultRestaurantSettings } from "@/types/restaurant";
import { toast } from "sonner";
import { thermalPrinter } from "@/services/thermalPrinter";

interface RestaurantSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RestaurantSettingsDialog = ({ open, onOpenChange }: RestaurantSettingsDialogProps) => {
  const [settings, setSettings] = useState<RestaurantSettings>(defaultRestaurantSettings);

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
