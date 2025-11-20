import { useState, useEffect, useCallback } from "react";

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: "log" | "info" | "warn" | "error";
  message: string;
  data?: any;
}

const MAX_LOGS = 500;
let logEntries: LogEntry[] = [];
let listeners: Set<(logs: LogEntry[]) => void> = new Set();

// Override console methods to capture logs
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

const addLog = (level: LogEntry["level"], args: any[]) => {
  const entry: LogEntry = {
    id: `${Date.now()}-${Math.random()}`,
    timestamp: new Date(),
    level,
    message: args.map(arg => 
      typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(" "),
    data: args.length === 1 && typeof args[0] === "object" ? args[0] : args,
  };

  logEntries = [entry, ...logEntries].slice(0, MAX_LOGS);
  listeners.forEach(listener => listener([...logEntries]));
};

// Override console methods
console.log = (...args: any[]) => {
  originalConsoleLog(...args);
  addLog("log", args);
};

console.info = (...args: any[]) => {
  originalConsoleInfo(...args);
  addLog("info", args);
};

console.warn = (...args: any[]) => {
  originalConsoleWarn(...args);
  addLog("warn", args);
};

console.error = (...args: any[]) => {
  originalConsoleError(...args);
  addLog("error", args);
};

export const useDebugLogger = () => {
  const [logs, setLogs] = useState<LogEntry[]>(logEntries);

  useEffect(() => {
    listeners.add(setLogs);
    return () => {
      listeners.delete(setLogs);
    };
  }, []);

  const clearLogs = useCallback(() => {
    logEntries = [];
    listeners.forEach(listener => listener([]));
  }, []);

  const exportLogs = useCallback(() => {
    const logsText = logs
      .map(log => `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] ${log.message}`)
      .join("\n\n");
    
    const blob = new Blob([logsText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  return { logs, clearLogs, exportLogs };
};
