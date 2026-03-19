"use client";

import { useState, useEffect } from "react";
import { getSettings, saveSettings, AppSettings, TranslationProvider } from "@/lib/storage";

interface OllamaModel {
  name: string;
  model: string;
}

const PROVIDERS = [
  { value: "ollama", label: "Ollama", description: "Local or remote Ollama server" },
  { value: "openrouter", label: "OpenRouter", description: "Access 200+ models via API" },
  { value: "openai", label: "OpenAI", description: "GPT models (paid)" },
] as const;

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    provider: "ollama",
    ollamaBaseUrl: "http://localhost:11434",
    ollamaModel: "llama3.2",
    openaiApiKey: "",
    openrouterApiKey: "",
  });
  
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
  }, []);

  const testConnection = async () => {
    setIsConnecting(true);
    setStatusMessage("Testing connection...");
    setStatusType("info");
    setIsConnected(false);
    setAvailableModels([]);

    try {
      if (settings.provider === "ollama") {
        const url = settings.ollamaBaseUrl || "http://localhost:11434";
        const response = await fetch(`${url}/api/tags`);
        if (response.ok) {
          setIsConnected(true);
          setStatusMessage("Connected to Ollama!");
          setStatusType("success");
          loadModels(url);
        } else {
          setStatusMessage(`Connection failed: ${response.status}`);
          setStatusType("error");
        }
      } else if (settings.provider === "openrouter") {
        if (!settings.openrouterApiKey) {
          setStatusMessage("Please enter your OpenRouter API key");
          setStatusType("error");
          setIsConnecting(false);
          return;
        }
        const response = await fetch("https://openrouter.ai/api/v1/models", {
          headers: { "Authorization": `Bearer ${settings.openrouterApiKey}` }
        });
        if (response.ok) {
          const data = await response.json();
          const models = (data.data || []).slice(0, 50);
          setAvailableModels(models.map((m: { id: string }) => ({ name: m.id, model: m.id })));
          setIsConnected(true);
          setStatusMessage("Connected to OpenRouter!");
          setStatusType("success");
        } else {
          setStatusMessage("Invalid OpenRouter API key");
          setStatusType("error");
        }
      } else if (settings.provider === "openai") {
        if (!settings.openaiApiKey) {
          setStatusMessage("Please enter your OpenAI API key");
          setStatusType("error");
          setIsConnecting(false);
          return;
        }
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: { "Authorization": `Bearer ${settings.openaiApiKey}` }
        });
        if (response.ok) {
          const data = await response.json();
          const models = (data.data || []).filter((m: { id: string }) => m.id.startsWith("gpt")).slice(0, 20);
          setAvailableModels(models.map((m: { id: string }) => ({ name: m.id, model: m.id })));
          setIsConnected(true);
          setStatusMessage("Connected to OpenAI!");
          setStatusType("success");
        } else {
          setStatusMessage("Invalid OpenAI API key");
          setStatusType("error");
        }
      }
    } catch {
      setStatusMessage("Connection failed. Check settings.");
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
        setAvailableModels((data.models || []) as OllamaModel[]);
      }
    } catch {
      console.error("Failed to load models");
    }
    setIsLoadingModels(false);
  };

  const handleSave = () => {
    saveSettings(settings);
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
        <h2 className="text-lg font-semibold mb-4">Select Provider</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {PROVIDERS.map((provider) => (
            <div
              key={provider.value}
              onClick={() => {
                setSettings(s => ({ ...s, provider: provider.value as TranslationProvider }));
                setIsConnected(false);
                setAvailableModels([]);
              }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                settings.provider === provider.value
                  ? "border-cyan-500 bg-cyan-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <h3 className="font-semibold">{provider.label}</h3>
              <p className="text-xs text-slate-500 mt-1">{provider.description}</p>
            </div>
          ))}
        </div>
      </div>

      {settings.provider === "ollama" && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Ollama Server</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Server URL</label>
              <input
                type="text"
                className="input"
                value={settings.ollamaBaseUrl}
                onChange={(e) => {
                  setSettings(s => ({ ...s, ollamaBaseUrl: e.target.value }));
                  setIsConnected(false);
                  setAvailableModels([]);
                }}
                placeholder="http://localhost:11434"
              />
              <p className="text-xs text-slate-500 mt-1">
                Local: localhost:11434 | Cloud: openclaw.ollama.ai
              </p>
            </div>
          </div>
        </div>
      )}

      {settings.provider === "openrouter" && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">OpenRouter Settings</h2>
          
          <div className="mb-4">
            <label className="label">OpenRouter API Key</label>
            <input
              type="password"
              className="input"
              value={settings.openrouterApiKey}
              onChange={(e) => {
                setSettings(s => ({ ...s, openrouterApiKey: e.target.value }));
                setIsConnected(false);
                setAvailableModels([]);
              }}
              placeholder="sk-or-..."
            />
            <p className="text-xs text-slate-500 mt-1">
              Get free API key from{" "}
              <a href="https://openrouter.ai" target="_blank" rel="noopener" className="text-cyan-600 underline">
                openrouter.ai
              </a>
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">Free Models on OpenRouter</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• google/gemma-3-4b-it:free</li>
              <li>• deepseek/deepseek-r1:free</li>
              <li>• qwen/qwen2.5-72b-instruct:free</li>
              <li>• meta-llama/llama-3.1-8b-instruct:free</li>
              <li>• mistralai/mistral-7b-instruct:free</li>
            </ul>
          </div>
        </div>
      )}

      {settings.provider === "openai" && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">OpenAI Settings</h2>
          
          <div className="mb-4">
            <label className="label">OpenAI API Key</label>
            <input
              type="password"
              className="input"
              value={settings.openaiApiKey}
              onChange={(e) => {
                setSettings(s => ({ ...s, openaiApiKey: e.target.value }));
                setIsConnected(false);
                setAvailableModels([]);
              }}
              placeholder="sk-..."
            />
            <p className="text-xs text-slate-500 mt-1">
              Get API key from{" "}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-cyan-600 underline">
                platform.openai.com
              </a>
            </p>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Model Selection</h2>
          <button
            onClick={testConnection}
            disabled={isConnecting}
            className="btn btn-primary"
          >
            {isConnecting ? "Testing..." : "Test & Load Models"}
          </button>
        </div>

        {statusMessage && (
          <p className={`mb-4 text-sm ${
            statusType === "success" ? "text-green-600" :
            statusType === "error" ? "text-red-600" : "text-blue-600"
          }`}>
            {statusMessage}
          </p>
        )}

        {isConnected && (
          <>
            {isLoadingModels ? (
              <p className="text-slate-500">Loading models...</p>
            ) : availableModels.length > 0 ? (
              <div>
                <label className="label">Select Model</label>
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
                  {availableModels.length} model(s) available
                </p>
              </div>
            ) : (
              <div>
                <label className="label">Model Name</label>
                <input
                  type="text"
                  className="input"
                  value={settings.ollamaModel}
                  onChange={(e) => setSettings(s => ({ ...s, ollamaModel: e.target.value }))}
                  placeholder="llama3.2, gemma3, etc."
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleSave} className="btn btn-primary">
          Save Settings
        </button>
        {saved && (
          <span className="text-green-600">Settings saved!</span>
        )}
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-2">Quick Setup</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-800 mb-2">Option 1: OpenRouter (Recommended - Free)</h3>
            <ol className="text-purple-700 space-y-1 text-xs">
              <li>1. Select: <strong>OpenRouter</strong> provider</li>
              <li>2. Get free key from openrouter.ai</li>
              <li>3. Enter API key</li>
              <li>4. Model: <code>google/gemma-3-4b-it:free</code></li>
            </ol>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Option 2: Local Ollama</h3>
            <ol className="text-blue-700 space-y-1 text-xs">
              <li>1. Select: <strong>Ollama</strong> provider</li>
              <li>2. Server: <code>localhost:11434</code></li>
              <li>3. Install from ollama.com</li>
              <li>4. Run: <code>ollama pull llama3.2</code></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
