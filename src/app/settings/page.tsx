"use client";

import { useState, useEffect } from "react";
import { getSettings, saveSettings, AppSettings } from "@/lib/storage";

const LOCAL_MODELS = [
  { value: "llama3.2", label: "Llama 3.2 (Local)" },
  { value: "llama3.1", label: "Llama 3.1 (Local)" },
  { value: "llama3", label: "Llama 3 (Local)" },
  { value: "mistral", label: "Mistral (Local)" },
  { value: "mixtral", label: "Mixtral (Local)" },
  { value: "phi3", label: "Phi-3 (Local)" },
  { value: "gemma2", label: "Gemma 2 (Local)" },
  { value: "qwen2.5", label: "Qwen 2.5 (Local)" },
  { value: "qwen3", label: "Qwen 3 (Local)" },
  { value: "qwen3-coder", label: "Qwen 3 Coder (Local)" },
  { value: "phi4", label: "Phi-4 (Local)" },
  { value: "deepseek-r1", label: "DeepSeek R1 (Local)" },
  { value: "deepseek-v3", label: "DeepSeek V3 (Local)" },
];

const CLOUD_MODELS = [
  { value: "kimi-k2.5", label: "Kimi K2.5 (Free - OpenClaw)", category: "cloud" },
  { value: "glm-5", label: "GLM-5 (Free - OpenClaw)", category: "cloud" },
  { value: "qwen3-coder:480b-cloud", label: "Qwen3 Coder 480B (Ollama Cloud)", category: "cloud" },
  { value: "deepseek-v3.1:671b-cloud", label: "DeepSeek V3.1 671B (Ollama Cloud)", category: "cloud" },
  { value: "deepseek-v3.2", label: "DeepSeek V3.2 (Free - Ollama Cloud)", category: "cloud" },
  { value: "minimax-m2.5", label: "MiniMax M2.5 (Free - Ollama Cloud)", category: "cloud" },
  { value: "minimax-m2.7", label: "MiniMax M2.7 (Free - Ollama Cloud)", category: "cloud" },
  { value: "devstral-small-2", label: "Devstral Small 2 (Free - Ollama Cloud)", category: "cloud" },
  { value: "gemini-3-flash-preview", label: "Gemini 3 Flash (Free - Ollama Cloud)", category: "cloud" },
  { value: "gpt-oss:20b-cloud", label: "GPT-OSS 20B (Ollama Cloud)", category: "cloud" },
  { value: "gpt-oss:120b-cloud", label: "GPT-OSS 120B (Ollama Cloud)", category: "cloud" },
];

const OLLAMA_BASE_URLS = [
  { value: "http://localhost:11434", label: "Local (localhost:11434)" },
  { value: "https://openclaw.ollama.ai", label: "OpenClaw Cloud (Free)" },
  { value: "https://cloud.ollama.ai", label: "Ollama Cloud" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    ollamaBaseUrl: "http://localhost:11434",
    ollamaModel: "llama3.2",
    openaiApiKey: "",
  });
  const [saved, setSaved] = useState(false);
  const [testingOllama, setTestingOllama] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<"success" | "error" | "">("");
  const [showCustomUrl, setShowCustomUrl] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const testOllamaConnection = async () => {
    setTestingOllama(true);
    setOllamaStatus("");
    try {
      const response = await fetch(`${settings.ollamaBaseUrl}/api/tags`);
      if (response.ok) {
        setOllamaStatus("success");
      } else {
        setOllamaStatus("error");
      }
    } catch {
      setOllamaStatus("error");
    }
    setTestingOllama(false);
  };

  const testModel = async () => {
    setTestingOllama(true);
    setOllamaStatus("");
    try {
      const response = await fetch(`${settings.ollamaBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: settings.ollamaModel,
          messages: [{ role: "user", content: "Hello" }],
          stream: false,
        }),
      });
      if (response.ok) {
        setOllamaStatus("success");
      } else {
        setOllamaStatus("error");
      }
    } catch {
      setOllamaStatus("error");
    }
    setTestingOllama(false);
  };

  const handleUrlChange = (url: string) => {
    if (url === "custom") {
      setShowCustomUrl(true);
      setSettings({ ...settings, ollamaBaseUrl: "" });
    } else {
      setShowCustomUrl(false);
      setSettings({ ...settings, ollamaBaseUrl: url });
    }
  };

  const isCloudModel = (model: string) => CLOUD_MODELS.some(m => m.value === model);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure translation and AI settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Ollama Settings</h2>
          <p className="text-sm text-slate-600 mb-4">
            Configure Ollama for Bengali to English translation. Use local models (free) or cloud models.
          </p>

          <div className="space-y-4">
            <div>
              <label className="label">Ollama Server</label>
              <select
                className="select"
                value={showCustomUrl ? "custom" : OLLAMA_BASE_URLS.find(u => u.value === settings.ollamaBaseUrl)?.value || ""}
                onChange={(e) => handleUrlChange(e.target.value)}
              >
                {OLLAMA_BASE_URLS.map((url) => (
                  <option key={url.value} value={url.value}>
                    {url.label}
                  </option>
                ))}
                <option value="custom">Custom URL...</option>
              </select>
              {showCustomUrl && (
                <input
                  type="text"
                  className="input mt-2"
                  value={settings.ollamaBaseUrl}
                  onChange={(e) => setSettings({ ...settings, ollamaBaseUrl: e.target.value })}
                  placeholder="https://your-ollama-server.com"
                />
              )}
            </div>

            <div>
              <label className="label">Translation Model</label>
              <select
                className="select"
                value={settings.ollamaModel}
                onChange={(e) => setSettings({ ...settings, ollamaModel: e.target.value })}
              >
                <optgroup label="Local Models (Free - Run on your computer)">
                  {LOCAL_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Cloud Models (Free - Use internet)">
                  {CLOUD_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </optgroup>
              </select>
              {isCloudModel(settings.ollamaModel) && (
                <p className="text-xs text-cyan-600 mt-1">
                  Cloud model selected - requires internet connection
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={testOllamaConnection}
                disabled={testingOllama || !settings.ollamaBaseUrl}
                className="btn btn-secondary flex-1"
              >
                Test Connection
              </button>
              <button
                onClick={testModel}
                disabled={testingOllama || !settings.ollamaModel}
                className="btn btn-secondary flex-1"
              >
                Test Model
              </button>
            </div>

            {ollamaStatus === "success" && (
              <p className="text-sm text-green-600">Connection successful!</p>
            )}
            {ollamaStatus === "error" && (
              <p className="text-sm text-red-600">Connection failed. Check URL and ensure service is running.</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">OpenAI Settings (Optional)</h2>
          <p className="text-sm text-slate-600 mb-4">
            Configure OpenAI as a fallback when Ollama is unavailable.
          </p>

          <div className="space-y-4">
            <div>
              <label className="label">OpenAI API Key</label>
              <input
                type="password"
                className="input"
                value={settings.openaiApiKey}
                onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                placeholder="sk-..."
              />
              <p className="text-xs text-slate-500 mt-1">
                Get your API key from openai.com/api-key
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Translation Priority:</h3>
              <ol className="text-sm text-slate-600 space-y-1">
                <li>1. Ollama (local/cloud) - Primary</li>
                <li>2. OpenAI (cloud, paid) - Fallback</li>
                <li>3. Basic translation - Final fallback</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button onClick={handleSave} className="btn btn-primary">
          Save Settings
        </button>
        {saved && (
          <span className="ml-3 text-green-600">Settings saved successfully!</span>
        )}
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-4">How to Use Free Cloud Models</h2>
        <div className="prose prose-sm max-w-none text-slate-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">Option 1: OpenClaw (Recommended - Free)</h3>
              <p className="text-sm mb-2">OpenClaw provides free access to cloud models including Kimi K2.5 and GLM-5.</p>
              <ul className="text-xs list-disc pl-4 space-y-1">
                <li>Select: <strong>https://openclaw.ollama.ai</strong> as server</li>
                <li>Model: <strong>kimi-k2.5</strong> or <strong>glm-5</strong></li>
                <li>No setup required - just select and test</li>
              </ul>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Option 2: Ollama Cloud (Free)</h3>
              <p className="text-sm mb-2">Official Ollama cloud models.</p>
              <ul className="text-xs list-disc pl-4 space-y-1">
                <li>Select: <strong>https://cloud.ollama.ai</strong> as server</li>
                <li>Models: deepseek-v3.2, minimax-m2.5, etc.</li>
                <li>May require Ollama Pro account</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-800 mb-2">Option 3: Local Models (Free)</h3>
              <p className="text-sm mb-2">Run models on your own computer.</p>
              <ul className="text-xs list-disc pl-4 space-y-1">
                <li>Select: <strong>Local (localhost:11434)</strong></li>
                <li>Install Ollama from ollama.com</li>
                <li>Run: <code>ollama pull llama3.2</code></li>
              </ul>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <h3 className="font-medium text-amber-800 mb-2">Option 4: Custom Server</h3>
              <p className="text-sm mb-2">Connect to any Ollama-compatible server.</p>
              <ul className="text-xs list-disc pl-4 space-y-1">
                <li>Select: <strong>Custom URL...</strong></li>
                <li>Enter your server URL</li>
                <li>Works with any Ollama API endpoint</li>
              </ul>
            </div>
          </div>
          <p className="mt-4">
            <strong>Recommended for translation</strong>: Try <code>kimi-k2.5</code> with OpenClaw server - it&apos;s free and great at translations!
          </p>
        </div>
      </div>
    </div>
  );
}
