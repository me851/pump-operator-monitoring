"use client";

import { useState, useEffect } from "react";
import { getSettings, saveSettings, AppSettings } from "@/lib/storage";

interface OllamaModel {
  name: string;
  model: string;
}

const DEFAULT_SERVERS = [
  { label: "Local", host: "localhost", port: "11434" },
  { label: "OpenClaw (Free)", host: "openclaw.ollama.ai", port: "" },
  { label: "Ollama Cloud", host: "cloud.ollama.ai", port: "" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    ollamaBaseUrl: "http://localhost:11434",
    ollamaModel: "llama3.2",
    openaiApiKey: "",
  });
  
  const [serverType, setServerType] = useState<"local" | "cloud">("local");
  const [customHost, setCustomHost] = useState("");
  const [customPort, setCustomPort] = useState("11434");
  const [saved, setSaved] = useState(false);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "info">("info");
  
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    const loaded = getSettings();
    setSettings(loaded);
    
    if (loaded.ollamaBaseUrl.includes("localhost")) {
      setServerType("local");
      const url = new URL(loaded.ollamaBaseUrl);
      setCustomHost(url.hostname);
      setCustomPort(url.port || "11434");
    } else {
      setServerType("cloud");
      setCustomHost(loaded.ollamaBaseUrl.replace(/^https?:\/\//, ""));
    }
  }, []);

  const getBaseUrl = (): string => {
    if (serverType === "local") {
      return `http://${customHost}:${customPort}`;
    }
    if (customHost.includes("://")) {
      return customHost;
    }
    return `https://${customHost}`;
  };

  const testConnection = async () => {
    const url = getBaseUrl();
    setIsConnecting(true);
    setStatusMessage("Connecting to server...");
    setStatusType("info");
    setIsConnected(false);
    setAvailableModels([]);

    try {
      const response = await fetch(`${url}/api/tags`);
      if (response.ok) {
        setIsConnected(true);
        setStatusMessage("Connected successfully!");
        setStatusType("success");
        setSettings(s => ({ ...s, ollamaBaseUrl: url }));
        loadModels(url);
      } else {
        setStatusMessage(`Connection failed: ${response.status}`);
        setStatusType("error");
      }
    } catch (err) {
      setStatusMessage("Connection failed. Server unreachable.");
      setStatusType("error");
    }
    
    setIsConnecting(false);
  };

  const loadModels = async (url: string) => {
    setIsLoadingModels(true);
    try {
      const response = await fetch(`${url}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        const models = (data.models || []) as OllamaModel[];
        setAvailableModels(models);
      }
    } catch {
      console.error("Failed to load models");
    }
    setIsLoadingModels(false);
  };

  const handleSave = () => {
    const url = getBaseUrl();
    saveSettings({ ...settings, ollamaBaseUrl: url });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Translation Settings</h1>
        <p className="page-subtitle">Configure AI translation for WhatsApp imports</p>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Server Connection</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Server Type</label>
            <select
              className="select"
              value={serverType}
              onChange={(e) => {
                setServerType(e.target.value as "local" | "cloud");
                setIsConnected(false);
                setAvailableModels([]);
                if (e.target.value === "local") {
                  setCustomHost("localhost");
                  setCustomPort("11434");
                } else {
                  setCustomHost("openclaw.ollama.ai");
                  setCustomPort("");
                }
              }}
            >
              <option value="local">Local (Your Computer)</option>
              <option value="cloud">Cloud (Remote)</option>
            </select>
          </div>

          <div>
            <label className="label">
              {serverType === "local" ? "Host Address" : "Server URL"}
            </label>
            <input
              type="text"
              className="input"
              value={customHost}
              onChange={(e) => {
                setCustomHost(e.target.value);
                setIsConnected(false);
                setAvailableModels([]);
              }}
              placeholder={serverType === "local" ? "localhost" : "openclaw.ollama.ai"}
            />
          </div>

          {serverType === "local" && (
            <div>
              <label className="label">Port</label>
              <input
                type="text"
                className="input"
                value={customPort}
                onChange={(e) => {
                  setCustomPort(e.target.value);
                  setIsConnected(false);
                  setAvailableModels([]);
                }}
                placeholder="11434"
              />
            </div>
          )}
        </div>

        <button
          onClick={testConnection}
          disabled={isConnecting || !customHost}
          className="btn btn-primary"
        >
          {isConnecting ? "Connecting..." : isConnected ? "Reconnect" : "Connect"}
        </button>

        {statusMessage && (
          <p className={`mt-3 text-sm ${
            statusType === "success" ? "text-green-600" :
            statusType === "error" ? "text-red-600" : "text-blue-600"
          }`}>
            {statusMessage}
          </p>
        )}
      </div>

      {isConnected && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Model</h2>
          
          {isLoadingModels ? (
            <p className="text-slate-500">Loading available models...</p>
          ) : availableModels.length > 0 ? (
            <div>
              <label className="label">Available Models on Server</label>
              <select
                className="select"
                value={settings.ollamaModel}
                onChange={(e) => setSettings(s => ({ ...s, ollamaModel: e.target.value }))}
              >
                {availableModels.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-2">
                {availableModels.length} model(s) available on this server
              </p>
            </div>
          ) : (
            <div>
              <p className="text-amber-600 mb-3">No models found on server. Enter model name manually:</p>
              <label className="label">Model Name</label>
              <input
                type="text"
                className="input"
                value={settings.ollamaModel}
                onChange={(e) => setSettings(s => ({ ...s, ollamaModel: e.target.value }))}
                placeholder="llama3.2, kimi-k2.5, etc."
              />
            </div>
          )}
        </div>
      )}

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Fallback Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">OpenAI API Key (Optional)</label>
            <input
              type="password"
              className="input"
              value={settings.openaiApiKey}
              onChange={(e) => setSettings(s => ({ ...s, openaiApiKey: e.target.value }))}
              placeholder="sk-..."
            />
            <p className="text-xs text-slate-500 mt-1">
              Used when Ollama is unavailable
            </p>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Translation Priority</h3>
            <ol className="text-sm text-slate-600 space-y-1">
              <li>1. Ollama ({serverType === "local" ? "Local" : "Cloud"})</li>
              <li>2. OpenAI (if API key provided)</li>
              <li>3. Basic keyword translation</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleSave} className="btn btn-primary">
          Save Settings
        </button>
        {saved && (
          <span className="text-green-600">Settings saved!</span>
        )}
      </div>

      {isConnected && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold mb-2">Quick Tips</h2>
          <div className="text-sm text-slate-600 space-y-2">
            <p>
              <strong>For free cloud translation:</strong> Use OpenClaw server ({customHost.includes("openclaw") ? "already selected" : "enter: openclaw.ollama.ai"}) 
              with model: <code>kimi-k2.5</code> or <code>glm-5</code>
            </p>
            <p>
              <strong>For local:</strong> Install Ollama from ollama.com, then run: <code>ollama pull llama3.2</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
