"use client";

import { useState, useEffect } from "react";
import { getSettings, saveSettings, AppSettings } from "@/lib/storage";

const OLLAMA_MODELS = [
  { value: "llama3.2", label: "Llama 3.2" },
  { value: "llama3.1", label: "Llama 3.1" },
  { value: "llama3", label: "Llama 3" },
  { value: "llama2", label: "Llama 2" },
  { value: "mistral", label: "Mistral" },
  { value: "mixtral", label: "Mixtral" },
  { value: "phi3", label: "Phi-3" },
  { value: "gemma2", label: "Gemma 2" },
  { value: "gemma", label: "Gemma" },
  { value: "qwen2.5", label: "Qwen 2.5" },
  { value: "qwen2", label: "Qwen 2" },
  { value: "phi4", label: "Phi-4" },
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
            Configure your local Ollama instance for Bengali to English translation.
            Ollama must be running on your computer.
          </p>

          <div className="space-y-4">
            <div>
              <label className="label">Ollama Base URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  value={settings.ollamaBaseUrl}
                  onChange={(e) => setSettings({ ...settings, ollamaBaseUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                />
                <button
                  onClick={testOllamaConnection}
                  disabled={testingOllama}
                  className="btn btn-secondary"
                >
                  {testingOllama ? "Testing..." : "Test"}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Default: http://localhost:11434
              </p>
            </div>

            <div>
              <label className="label">Translation Model</label>
              <select
                className="select"
                value={settings.ollamaModel}
                onChange={(e) => setSettings({ ...settings, ollamaModel: e.target.value })}
              >
                {OLLAMA_MODELS.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Models supported: Llama 3.2/3.1/3/2, Mistral, Mixtral, Phi-3, Gemma, Qwen 2.5
              </p>
            </div>

            <button
              onClick={testModel}
              disabled={testingOllama}
              className="btn btn-secondary w-full"
            >
              Test Selected Model
            </button>

            {ollamaStatus === "success" && (
              <p className="text-sm text-green-600">Connection successful!</p>
            )}
            {ollamaStatus === "error" && (
              <p className="text-sm text-red-600">Connection failed. Check URL and ensure Ollama is running.</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">OpenAI Settings (Optional)</h2>
          <p className="text-sm text-slate-600 mb-4">
            Configure OpenAI as a fallback when Ollama is unavailable.
            This requires an OpenAI API key.
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
                <li>1. Ollama (local, free) - Primary</li>
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
        <h2 className="text-lg font-semibold mb-4">How Translation Works</h2>
        <div className="prose prose-sm max-w-none text-slate-600">
          <p>
            When you import WhatsApp messages, the system attempts to translate Bengali messages to English:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Ollama (Primary)</strong>: Uses a local AI model running on your machine. 
              No internet required, free to use. Make sure Ollama is installed and running.
            </li>
            <li>
              <strong>OpenAI (Fallback)</strong>: Uses OpenAI&apos;s GPT API if Ollama fails. 
              Requires an API key and internet connection. Usage costs apply.
            </li>
            <li>
              <strong>Basic Translation (Final)</strong>: Falls back to a simple keyword-based 
              translation if both AI options fail.
            </li>
          </ul>
          <p className="mt-2">
            <strong>To install Ollama</strong>: Visit{" "}
            <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="text-cyan-600 underline">
              ollama.com
            </a>{" "}
            and download for Windows/Mac/Linux. Then run:{" "}
            <code className="bg-slate-100 px-1 rounded">ollama pull llama3.2</code>
          </p>
        </div>
      </div>
    </div>
  );
}
