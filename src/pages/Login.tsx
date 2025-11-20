import { useState, useEffect } from "react";
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

  // התחברות אוטומטית בטעינת הדף
  useEffect(() => {
    const savedToken = localStorage.getItem("pos_token");
    const savedApiUrl = localStorage.getItem("pos_api_url");

    if (savedToken && savedApiUrl) {
      console.log("🔄 Found saved credentials, attempting auto-login...");
      setToken(savedToken);
      setApiUrl(savedApiUrl);
      
      // התחברות אוטומטית
      const autoLogin = async () => {
        setIsLoading(true);
        try {
          const url = `${savedApiUrl}/api/pos/auth`;
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify({ token: savedToken }),
          });

          const data = await response.json();
          
          if (data.success) {
            console.log("✅ Auto-login successful");
            localStorage.setItem("device_name", data.device?.name || "POS Device");
            toast.success("התחברת אוטומטית!");
            navigate("/orders");
          } else {
            console.log("❌ Auto-login failed, clearing saved credentials");
            toast.error("טוקן שמור לא תקין, נא להתחבר מחדש");
          }
        } catch (error) {
          console.error("❌ Auto-login error:", error);
          toast.error("שגיאה בהתחברות אוטומטית");
        } finally {
          setIsLoading(false);
        }
      };

      autoLogin();
    }
  }, [navigate]);

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
    let normalized = "";
    const startTime = performance.now();

    try {
      normalized = normalizeApiUrl(apiUrl);

      if (/lovable\.app/i.test(normalized)) {
        toast.error("נא להזין את דומיין ה-Laravel (למשל https://shahin-kitchen.com), לא את כתובת האפליקציה");
        setIsLoading(false);
        return;
      }

      const url = `${normalized}/api/pos/auth`;
      
      console.log("=== 🔐 LOGIN REQUEST START ===");
      console.log("🔍 Sending POST request to:", url);
      console.log("📦 Request body:", { token: token.substring(0, 10) + "..." });
      console.log("⏰ Request timestamp:", new Date().toISOString());
      console.log("🌐 Origin:", window.location.origin);
      console.log("📱 User Agent:", navigator.userAgent);
      console.log("🌐 Network state:", navigator.onLine ? "Online" : "Offline");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      console.log("=== 🔐 LOGIN RESPONSE ===");
      console.log("📥 Response status:", response.status);
      console.log("📥 Response statusText:", response.statusText);
      console.log("⏱️ Response time:", duration, "ms");
      console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()));

      const contentType = response.headers.get("content-type");
      console.log("📋 Content-Type:", contentType);
      let data;
      
      if (contentType?.includes("application/json")) {
        data = await response.json();
        console.log("✅ SUCCESS - Login response");
        console.log("📦 Response data:", JSON.stringify(data, null, 2));
      } else {
        const text = await response.text();
        console.log("❌ Non-JSON response:", text.substring(0, 1000));
        toast.error("השרת החזיר תשובה לא תקינה (לא JSON)");
        setIsLoading(false);
        return;
      }

      if (data.success) {
        console.log("✅ Authentication successful");
        localStorage.setItem("pos_token", token);
        localStorage.setItem("pos_api_url", normalized);
        localStorage.setItem("device_name", data.device?.name || "POS Device");
        toast.success("התחברת בהצלחה!");
        navigate("/orders");
      } else {
        console.log("❌ Authentication failed:", data.message);
        toast.error(data.message || "טוקן לא תקין");
      }
    } catch (error) {
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      
      console.log("=== ❌ LOGIN ERROR ===");
      console.error("❌ Login error:", error);
      console.error("⏱️ Failed after:", duration, "ms");
      console.error("🔍 Error type:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("📝 Error message:", error instanceof Error ? error.message : String(error));
      console.error("📚 Error stack:", error instanceof Error ? error.stack : "No stack trace");
      console.error("🌐 Network state:", navigator.onLine ? "Online" : "Offline");
      
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        toast.error(
          "לא ניתן להתחבר לשרת",
          {
            description: `נסה לבדוק:
• האם ${normalized} זמין?
• האם הגדרת CORS ב-Laravel?
• האם SSL תקין (אם משתמש ב-HTTPS)?`,
            duration: 8000,
          }
        );
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
                placeholder="https://example.com/"
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
