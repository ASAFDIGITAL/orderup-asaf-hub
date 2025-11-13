import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, Plus, Smartphone, Trash2 } from "lucide-react";

interface PosDevice {
  id: number;
  device_name: string;
  api_token: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export default function PosDevices() {
  const [devices, setDevices] = useState<PosDevice[]>([]);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Generate random token
  const generateToken = () => {
    return Array.from({ length: 64 }, () => 
      Math.random().toString(36).charAt(2)
    ).join('').substring(0, 64);
  };

  const handleCreateDevice = async () => {
    if (!newDeviceName.trim()) {
      toast.error("נא להזין שם למכשיר");
      return;
    }

    setLoading(true);
    const token = generateToken();

    try {
      // TODO: Replace with actual API call to Laravel
      // const response = await fetch('/api/admin/pos-devices', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ device_name: newDeviceName, api_token: token })
      // });
      
      // Mock device creation for now
      const newDevice: PosDevice = {
        id: Date.now(),
        device_name: newDeviceName,
        api_token: token,
        is_active: true,
        last_used_at: null,
        created_at: new Date().toISOString(),
      };

      setDevices([...devices, newDevice]);
      setNewToken(token);
      setNewDeviceName("");
      toast.success("מכשיר POS נוצר בהצלחה!");
    } catch (error) {
      toast.error("שגיאה ביצירת המכשיר");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("הטוקן הועתק ללוח");
  };

  const handleDeleteDevice = async (id: number) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק מכשיר זה?")) return;

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/admin/pos-devices/${id}`, { method: 'DELETE' });
      
      setDevices(devices.filter(d => d.id !== id));
      toast.success("המכשיר נמחק בהצלחה");
    } catch (error) {
      toast.error("שגיאה במחיקת המכשיר");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">מכשירי POS</h1>
            <p className="text-muted-foreground mt-1">נהל מכשירי קופה ומדפסות מחוברות</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                הוסף מכשיר חדש
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>יצירת מכשיר POS חדש</DialogTitle>
                <DialogDescription>
                  הזן שם מזהה למכשיר. הטוקן יווצר אוטומטית.
                </DialogDescription>
              </DialogHeader>

              {!newToken ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="device-name">שם המכשיר</Label>
                    <Input
                      id="device-name"
                      placeholder="למשל: מדפסת מטבח 1"
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCreateDevice} 
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? "יוצר..." : "צור מכשיר"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg space-y-2">
                    <p className="text-sm font-semibold text-success">מכשיר נוצר בהצלחה! ✓</p>
                    <p className="text-xs text-muted-foreground">
                      העתק את הטוקן עכשיו - הוא לא יוצג שוב מסיבות אבטחה.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>טוקן API (חד-פעמי)</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={newToken} 
                        readOnly 
                        className="font-mono text-xs"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleCopyToken(newToken)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={() => {
                      setNewToken(null);
                      setIsDialogOpen(false);
                    }}
                    className="w-full"
                  >
                    סגור
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {devices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Smartphone className="h-16 w-16 text-muted-foreground/40 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">אין מכשירים רשומים</p>
              <p className="text-sm text-muted-foreground mt-1">התחל בהוספת מכשיר POS ראשון</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <Card key={device.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{device.device_name}</CardTitle>
                    </div>
                    <Badge variant={device.is_active ? "default" : "secondary"}>
                      {device.is_active ? "פעיל" : "לא פעיל"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    נוצר: {new Date(device.created_at).toLocaleDateString('he-IL')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">טוקן (מוסתר)</p>
                    <div className="font-mono text-xs bg-muted p-2 rounded">
                      {device.api_token.substring(0, 8)}...
                    </div>
                  </div>

                  {device.last_used_at && (
                    <p className="text-xs text-muted-foreground">
                      שימוש אחרון: {new Date(device.last_used_at).toLocaleString('he-IL')}
                    </p>
                  )}

                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleDeleteDevice(device.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    מחק מכשיר
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
