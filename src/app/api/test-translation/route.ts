import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey, provider } = body;

    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 400 });
    }

    let url = "";
    let model = "";

    if (provider === "ollama-cloud") {
      url = "https://ollama.com/v1/chat/completions";
      model = "kimi-k2.5";
    } else if (provider === "openrouter") {
      url = "https://openrouter.ai/api/v1/chat/completions";
      model = "google/gemma-3-4b-it:free";
    } else if (provider === "openai") {
      url = "https://api.openai.com/v1/chat/completions";
      model = "gpt-4o-mini";
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    };

    if (provider === "openrouter") {
      headers["HTTP-Referer"] = "http://localhost";
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Hi" }],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: "Connection failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
