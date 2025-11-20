import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebugLogger } from "@/hooks/use-debug-logger";
import { ArrowLeft, Trash2, Download, Search, AlertCircle, Info, AlertTriangle, Terminal } from "lucide-react";

const Debug = () => {
  const navigate = useNavigate();
  const { logs, clearLogs, exportLogs } = useDebugLogger();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === "all" || log.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Terminal className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "border-destructive/50 bg-destructive/5";
      case "warn":
        return "border-yellow-500/50 bg-yellow-500/5";
      case "info":
        return "border-blue-500/50 bg-blue-500/5";
      default:
        return "border-border bg-muted/50";
    }
  };

  const logCounts = {
    all: logs.length,
    log: logs.filter(l => l.level === "log").length,
    info: logs.filter(l => l.level === "info").length,
    warn: logs.filter(l => l.level === "warn").length,
    error: logs.filter(l => l.level === "error").length,
  };

  return (
    <div className="min-h-screen bg-background p-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/orders")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">מסך דיבוג</h1>
              <p className="text-muted-foreground">
                לוגים בזמן אמת לזיהוי בעיות רשת
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              disabled={logs.length === 0}
            >
              <Download className="h-4 w-4 ml-2" />
              ייצא לוגים
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearLogs}
              disabled={logs.length === 0}
            >
              <Trash2 className="h-4 w-4 ml-2" />
              נקה הכל
            </Button>
          </div>
        </div>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">מידע מערכת</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">API URL</p>
              <p className="font-mono text-xs break-all">
                {localStorage.getItem("pos_api_url") || "לא מוגדר"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Token</p>
              <p className="font-mono text-xs">
                {localStorage.getItem("pos_token")?.substring(0, 20)}...
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Device</p>
              <p className="font-mono text-xs">
                {localStorage.getItem("device_name") || "לא מוגדר"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">מצב רשת</p>
              <Badge variant={navigator.onLine ? "default" : "destructive"}>
                {navigator.onLine ? "מחובר" : "לא מחובר"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש בלוגים..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Tabs value={selectedLevel} onValueChange={setSelectedLevel} className="w-full sm:w-auto">
                <TabsList className="grid grid-cols-5 w-full sm:w-auto">
                  <TabsTrigger value="all" className="text-xs">
                    הכל ({logCounts.all})
                  </TabsTrigger>
                  <TabsTrigger value="log" className="text-xs">
                    Log ({logCounts.log})
                  </TabsTrigger>
                  <TabsTrigger value="info" className="text-xs">
                    Info ({logCounts.info})
                  </TabsTrigger>
                  <TabsTrigger value="warn" className="text-xs">
                    Warn ({logCounts.warn})
                  </TabsTrigger>
                  <TabsTrigger value="error" className="text-xs">
                    Error ({logCounts.error})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Logs Display */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>לוגים ({filteredLogs.length})</CardTitle>
              <Badge variant="outline">
                מעודכן אוטומטית
              </Badge>
            </div>
            <CardDescription>
              לוגים מוצגים מהחדש לישן
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] w-full">
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Terminal className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">אין לוגים להצגה</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || selectedLevel !== "all"
                      ? "אין לוגים התואמים את החיפוש או הסינון"
                      : "לוגים יופיעו כאן כאשר האפליקציה תפעל"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 border rounded-lg ${getLevelColor(log.level)}`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          {getLevelIcon(log.level)}
                          <Badge variant="outline" className="text-xs">
                            {log.level.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.timestamp.toLocaleTimeString("he-IL", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}.{log.timestamp.getMilliseconds().toString().padStart(3, '0')}
                        </span>
                      </div>
                      <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-background/50 p-3 rounded border">
                        {log.message}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Debug;
