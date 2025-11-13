import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const normalizeApiUrl = (u: string) => {
  let s = u.trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  return s.replace(/\/+$/, "");
};

const Login = () => {
  const [token, setToken] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      toast.error("נא להזין טוקן");
      return;
    }

    if (!apiUrl.trim()) {
      toast.error("נא להזין כתובת API");
      return;
    }

    setIsLoading(true);

    try {
      const normalized = normalizeApiUrl(apiUrl);

      if (/lovable\.app/i.test(normalized)) {
        toast.error("נא להזין את דומיין ה-Laravel (למשל https://shahin-kitchen.com), לא את כתובת האפליקציה");
        setIsLoading(false);
        return;
      }

      const url = `${normalized}/api/pos/auth`;
      console.log("🔍 Sending POST request to:", url);
      console.log("📦 Request body:", { token: token.substring(0, 10) + "..." });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      console.log("📥 Response status:", response.status);
      console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()));

      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType?.includes("application/json")) {
        data = await response.json();
        console.log("📥 Response data:", data);
      } else {
        const text = await response.text();
        console.log("📥 Response text:", text.substring(0, 200));
        toast.error("השרת החזיר תשובה לא תקינה (לא JSON)");
        setIsLoading(false);
        return;
      }

      if (data.success) {
        localStorage.setItem("pos_token", token);
        localStorage.setItem("pos_api_url", normalized);
        localStorage.setItem("device_name", data.device?.name || "POS Device");
        toast.success("התחברת בהצלחה!");
        navigate("/orders");
      } else {
        toast.error(data.message || "טוקן לא תקין");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        toast.error("לא ניתן להתחבר לשרת. בדוק CORS או כתובת API");
      } else {
        toast.error("שגיאה בהתחברות: " + (error instanceof Error ? error.message : "שגיאה לא ידועה"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">ASAF POS</CardTitle>
          <CardDescription className="text-base">
            מערכת ניהול הזמנות למטבח
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiUrl">כתובת API</Label>
              <Input
                id="apiUrl"
                type="url"
                placeholder="https://shahin-kitchen.com"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                disabled={isLoading}
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">טוקן אימות</Label>
              <Input
                id="token"
                type="text"
                placeholder="הזן טוקן"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isLoading}
                dir="ltr"
                className="text-left font-mono"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מתחבר...
                </>
              ) : (
                "התחבר"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
