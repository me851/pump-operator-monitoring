"use client";

import { useState, useEffect } from "react";
import { getSettings, saveSettings, AppSettings, TranslationProvider } from "@/lib/storage";

interface OllamaModel {
  name: string;
  model: string;
}

const PROVIDERS = [
  { value: "ollama-local", label: "Ollama Local", description: "Run locally on your computer" },
  { value: "ollama-cloud", label: "Ollama Cloud", description: "Ollama's cloud API" },
  { value: "openrouter", label: "OpenRouter", description: "200+ models (many free)" },
  { value: "openai", label: "OpenAI", description: "GPT models (paid)" },
] as const;

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    provider: "ollama-local",
    ollamaBaseUrl: "http://localhost:11434",
    ollamaModel: "llama3.2",
    openaiApiKey: "",
    openrouterApiKey: "",
    ollamaApiKey: "",
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
      if (settings.provider === "ollama-local") {
        const url = settings.ollamaBaseUrl || "http://localhost:11434";
        const response = await fetch(`${url}/api/tags`);
        if (response.ok) {
          setIsConnected(true);
          setStatusMessage("Connected to local Ollama!");
          setStatusType("success");
          loadLocalModels(url);
        } else {
          setStatusMessage(`Connection failed: ${response.status}`);
          setStatusType("error");
        }
      } else if (settings.provider === "ollama-cloud") {
        if (!settings.ollamaApiKey) {
          setStatusMessage("Please enter your Ollama API key");
          setStatusType("error");
          setIsConnecting(false);
          return;
        }
        try {
          const response = await fetch("https://ollama.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${settings.ollamaApiKey}`,
            },
            body: JSON.stringify({
              model: "llama3.2",
              messages: [{ role: "user", content: "Hi" }],
              stream: false,
            }),
          });
          if (response.ok) {
            setIsConnected(true);
            setStatusMessage("Connected to Ollama Cloud!");
            setStatusType("success");
            setAvailableModels([
              { name: "glm-4.6", model: "glm-4.6" },
              { name: "kimi-k2.5", model: "kimi-k2.5" },
              { name: "qwen3.5:397b", model: "qwen3.5:397b" },
              { name: "minimax-m2.5", model: "minimax-m2.5" },
              { name: "gemma3:4b", model: "gemma3:4b" },
              { name: "gemma3:12b", model: "gemma3:12b" },
              { name: "gemma3:27b", model: "gemma3:27b" },
              { name: "deepseek-v3.2", model: "deepseek-v3.2" },
              { name: "devstral-small-2:24b", model: "devstral-small-2:24b" },
              { name: "mistral-large-3:675b", model: "mistral-large-3:675b" },
            ]);
          } else {
            const errorText = await response.text();
            setStatusMessage(`Failed: ${response.status} - Check API key`);
            setStatusType("error");
          }
        } catch (err) {
          setStatusMessage("Connection failed. Check network/API key.");
          setStatusType("error");
        }
      } else if (settings.provider === "openrouter") {
        if (!settings.openrouterApiKey) {
          setStatusMessage("Please enter your OpenRouter API key");
          setStatusType("error");
          setIsConnecting(false);
          return;
        }
        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${settings.openrouterApiKey}`,
              "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "http://localhost",
            },
            body: JSON.stringify({
              model: "google/gemma-3-4b-it:free",
              messages: [{ role: "user", content: "Hi" }],
            }),
          });
          if (response.ok) {
            setIsConnected(true);
            setStatusMessage("Connected to OpenRouter!");
            setStatusType("success");
            setAvailableModels([
              { name: "google/gemma-3-4b-it:free", model: "google/gemma-3-4b-it:free" },
              { name: "deepseek/deepseek-r1:free", model: "deepseek/deepseek-r1:free" },
              { name: "meta-llama/llama-3.1-8b-instruct:free", model: "meta-llama/llama-3.1-8b-instruct:free" },
              { name: "mistralai/mistral-7b-instruct:free", model: "mistralai/mistral-7b-instruct:free" },
              { name: "qwen/qwen2.5-72b-instruct:free", model: "qwen/qwen2.5-72b-instruct:free" },
            ]);
          } else {
            setStatusMessage("Failed to connect. Check API key.");
            setStatusType("error");
          }
        } catch {
          setStatusMessage("Connection failed. Check network/API key.");
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

  const loadLocalModels = async (url: string) => {
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

      {settings.provider === "ollama-local" && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Local Ollama Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Host</label>
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
                Usually: http://localhost:11434
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Setup Local Ollama</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Download Ollama from{" "}<a href="https://ollama.com" target="_blank" className="underline">ollama.com</a></li>
              <li>2. Run: <code>ollama pull llama3.2</code></li>
              <li>3. Ollama will start automatically on port 11434</li>
            </ol>
          </div>
        </div>
      )}

      {settings.provider === "ollama-cloud" && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Ollama Cloud Settings</h2>
          
          <div className="mb-4">
            <label className="label">Ollama API Key</label>
            <input
              type="password"
              className="input"
              value={settings.ollamaApiKey}
              onChange={(e) => {
                setSettings(s => ({ ...s, ollamaApiKey: e.target.value }));
                setIsConnected(false);
                setAvailableModels([]);
              }}
              placeholder="ollama_..."
            />
            <p className="text-xs text-slate-500 mt-1">
              Get your API key from{" "}
              <a href="https://ollama.com/account" target="_blank" className="text-cyan-600 underline">
                ollama.com/account
              </a>
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-800 mb-2">Ollama Cloud Models</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• llama3.2, llama3.1, llama3</li>
              <li>• qwen2.5, qwen3</li>
              <li>• mistral, mixtral</li>
              <li>• gemma2, phi4</li>
            </ul>
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
              <a href="https://openrouter.ai" target="_blank" className="text-cyan-600 underline">
                openrouter.ai
              </a>
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">Free Models on OpenRouter</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• google/gemma-3-4b-it:free</li>
              <li>• deepseek/deepseek-r1:free</li>
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
              <a href="https://platform.openai.com/api-keys" target="_blank" className="text-cyan-600 underline">
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
        <h2 className="text-lg font-semibold mb-2">Quick Setup Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-800 mb-2">Ollama Cloud (API)</h3>
            <ol className="text-purple-700 space-y-1 text-xs">
              <li>1. Go to ollama.com/account</li>
              <li>2. Get your API key</li>
              <li>3. Select: <strong>Ollama Cloud</strong></li>
              <li>4. Enter API key → Test → Select model</li>
            </ol>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Local Ollama (Free)</h3>
            <ol className="text-blue-700 space-y-1 text-xs">
              <li>1. Install from ollama.com</li>
              <li>2. Run: <code>ollama pull llama3.2</code></li>
              <li>3. Select: <strong>Ollama Local</strong></li>
              <li>4. Click Test → Select model</li>
            </ol>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">OpenRouter (Many Free)</h3>
            <ol className="text-green-700 space-y-1 text-xs">
              <li>1. Go to openrouter.ai</li>
              <li>2. Get free API key</li>
              <li>3. Select: <strong>OpenRouter</strong></li>
              <li>4. Enter key → Test → Select free model</li>
            </ol>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg">
            <h3 className="font-medium text-amber-800 mb-2">OpenAI (Paid)</h3>
            <ol className="text-amber-700 space-y-1 text-xs">
              <li>1. Go to platform.openai.com</li>
              <li>2. Get API key</li>
              <li>3. Select: <strong>OpenAI</strong></li>
              <li>4. Enter key → Test → Select GPT model</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
